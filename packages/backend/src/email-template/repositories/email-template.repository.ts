import type { Prisma, PrismaClient } from "@prisma/client";
import type {
  CreateEmailTemplateData,
  EmailTemplateListItemView,
  EmailTemplateView,
  UpdateEmailTemplateData,
} from "../types";

interface EmailTemplateFileRef {
  fileId: string;
}

interface EmailTemplatePrismaRow extends EmailTemplateListItemView {
  html: string;
  design: unknown;
  trackingPixel: boolean;
  files: EmailTemplateFileRef[];
}

interface FindByOrganizationIdInput {
  search?: string;
  selectedId?: string;
  includeContent?: boolean;
  limit: number;
  offset: number;
  sort?: Array<{
    field: "name" | "status" | "createdAt" | "updatedAt";
    order: "asc" | "desc";
  }>;
  filters?: {
    status?: "DRAFT" | "ACTIVE";
  };
}

const authorSelect = {
  id: true,
  name: true,
  email: true,
} as const;

const previewSelect = {
  id: true,
  status: true,
  sourceRevision: true,
} as const;

const listSelect = {
  id: true,
  name: true,
  tags: true,
  status: true,
  organizationId: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  contentRevision: true,
  preview: { select: previewSelect },
  createdBy: { select: authorSelect },
} as const;

const detailSelect = {
  ...listSelect,
  html: true,
  design: true,
  trackingPixel: true,
  files: {
    select: {
      fileId: true,
    },
  },
} as const;

export class EmailTemplateRepository {
  constructor(private readonly db: PrismaClient) {}

  private toInputJsonValue(value: unknown): Prisma.InputJsonValue {
    return value as Prisma.InputJsonValue;
  }

  async findByOrganizationId(
    organizationId: string,
    input: FindByOrganizationIdInput,
  ): Promise<{ rows: EmailTemplateListItemView[]; total: number }> {
    const baseWhere: Prisma.EmailTemplateWhereInput = {
      organizationId,
      visibility: "CATALOG",
      status: input.filters?.status,
    };
    const selected = input.selectedId
      ? await this.db.emailTemplate.findFirst({
          where: {
            id: input.selectedId,
            organizationId,
            visibility: "CATALOG",
          },
          select: { ...listSelect, html: input.includeContent },
        })
      : null;
    const where: Prisma.EmailTemplateWhereInput = {
      ...baseWhere,
      id: selected ? { not: selected.id } : undefined,
      OR: input.search
        ? [
            {
              name: {
                contains: input.search,
                mode: "insensitive" as const,
              },
            },
            { tags: { has: input.search } },
          ]
        : undefined,
    };
    const orderBy = input.sort?.length
      ? input.sort.map((sort) => ({ [sort.field]: sort.order }))
      : [{ updatedAt: "desc" as const }];
    const includeSelected = Boolean(selected && input.offset === 0);
    const take = Math.max(0, input.limit - (includeSelected ? 1 : 0));
    const rows = take
      ? await this.db.emailTemplate.findMany({
          where,
          select: { ...listSelect, html: input.includeContent },
          orderBy,
          take,
          skip: selected ? Math.max(0, input.offset - 1) : input.offset,
        })
      : [];
    const total =
      (await this.db.emailTemplate.count({ where })) + (selected ? 1 : 0);
    const orderedRows = includeSelected ? [selected!, ...rows] : rows;

    return {
      rows: orderedRows.map((row) => ({
        ...row,
        preview: row.preview
          ? { ...row.preview, url: `/api/catalog-previews/${row.preview.id}` }
          : null,
      })) as EmailTemplateListItemView[],
      total,
    };
  }

  async findById(
    id: string,
    organizationId: string,
  ): Promise<EmailTemplateView | null> {
    const row = (await this.db.emailTemplate.findFirst({
      where: { id, organizationId, visibility: "CATALOG" },
      select: detailSelect,
    })) as EmailTemplatePrismaRow | null;

    if (!row) return null;

    return {
      ...row,
      preview: row.preview
        ? { ...row.preview, url: `/api/catalog-previews/${row.preview.id}` }
        : null,
      fileIds: row.files?.map((f) => f.fileId) ?? [],
    };
  }

  async create(data: CreateEmailTemplateData): Promise<EmailTemplateView> {
    const { fileIds, ...rest } = data;
    const uniqueFileIds = [...new Set(fileIds)];
    const row = await this.db.$transaction(async (tx) => {
      if (uniqueFileIds.length > 0) {
        const ownedFiles = await tx.file.count({
          where: {
            id: { in: uniqueFileIds },
            organizationId: data.organizationId,
            visibility: "CATALOG",
            purpose: "EMAIL_ATTACHMENT",
          },
        });
        if (ownedFiles !== uniqueFileIds.length)
          throw new Error("One or more attachments are unavailable");
      }

      return tx.emailTemplate.create({
        data: {
          ...rest,
          design: this.toInputJsonValue(rest.design),
          files: {
            create: uniqueFileIds.map((fileId) => ({ fileId })),
          },
        },
        select: detailSelect,
      });
    });

    const typedRow = row as unknown as EmailTemplatePrismaRow;
    return {
      ...typedRow,
      preview: typedRow.preview
        ? {
            ...typedRow.preview,
            url: `/api/catalog-previews/${typedRow.preview.id}`,
          }
        : null,
      fileIds: typedRow.files?.map((file) => file.fileId) ?? [],
    };
  }

  async update(
    id: string,
    organizationId: string,
    data: UpdateEmailTemplateData,
  ): Promise<EmailTemplateView> {
    const { fileIds, ...rest } = data;
    await this.db.$transaction(async (tx) => {
      const result = await tx.emailTemplate.updateMany({
        where: { id, organizationId, visibility: "CATALOG" },
        data: {
          ...rest,
          design: this.toInputJsonValue(rest.design),
          contentRevision: { increment: 1 },
        },
      });
      if (!result.count) throw new Error("Email template not found");

      await tx.catalogPreview.updateMany({
        where: { emailTemplateId: id },
        data: { status: "STALE" },
      });
      await tx.emailTemplateFile.deleteMany({ where: { emailTemplateId: id } });
      if (fileIds.length > 0) {
        const ownedFiles = await tx.file.count({
          where: {
            id: { in: fileIds },
            organizationId,
            visibility: "CATALOG",
            purpose: "EMAIL_ATTACHMENT",
          },
        });
        if (ownedFiles !== new Set(fileIds).size)
          throw new Error("One or more attachments are unavailable");
        await tx.emailTemplateFile.createMany({
          data: [...new Set(fileIds)].map((fileId) => ({
            emailTemplateId: id,
            fileId,
          })),
        });
      }
    });

    const row = await this.findById(id, organizationId);
    if (!row) throw new Error("Email template not found");
    return row;
  }

  async delete(id: string, organizationId: string): Promise<boolean> {
    const result = await this.db.emailTemplate.deleteMany({
      where: { id, organizationId, visibility: "CATALOG" },
    });

    return result.count > 0;
  }
}
