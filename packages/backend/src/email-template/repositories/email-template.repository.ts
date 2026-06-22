import type { Prisma, PrismaClient } from "@prisma/client";
import type {
  CreateEmailTemplateData,
  EmailTemplateListRow,
  EmailTemplateRow,
  UpdateEmailTemplateData,
} from "../types";

interface FindByOrganizationIdInput {
  search?: string;
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

const listSelect = {
  id: true,
  name: true,
  tags: true,
  status: true,
  organizationId: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
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
  ): Promise<{ rows: EmailTemplateListRow[]; total: number }> {
    const where: Record<string, unknown> = { organizationId };

    if (input.search) {
      where.OR = [
        { name: { contains: input.search, mode: "insensitive" as const } },
        { tags: { has: input.search } },
      ];
    }

    if (input.filters?.status) {
      where.status = input.filters.status;
    }

    const orderBy = input.sort?.length
      ? input.sort.map((sort) => ({ [sort.field]: sort.order }))
      : [{ updatedAt: "desc" as const }];

    const [rows, total] = await Promise.all([
      this.db.emailTemplate.findMany({
        where,
        select: listSelect,
        orderBy,
        take: input.limit,
        skip: input.offset,
      }),
      this.db.emailTemplate.count({ where }),
    ]);

    return { rows: rows as EmailTemplateListRow[], total };
  }

  async findById(
    id: string,
    organizationId: string,
  ): Promise<EmailTemplateRow | null> {
    return this.db.emailTemplate.findFirst({
      where: { id, organizationId },
      select: detailSelect,
    }) as Promise<EmailTemplateRow | null>;
  }

  async create(data: CreateEmailTemplateData): Promise<EmailTemplateRow> {
    const { fileIds, ...rest } = data;
    const row = await this.db.emailTemplate.create({
      data: {
        ...rest,
        design: this.toInputJsonValue(rest.design),
        files: {
          create: fileIds.map((fileId) => ({ fileId })),
        },
      },
      select: detailSelect,
    });

    return row as unknown as EmailTemplateRow;
  }

  async update(
    id: string,
    organizationId: string,
    data: UpdateEmailTemplateData,
  ): Promise<EmailTemplateRow> {
    const { fileIds, ...rest } = data;
    const result = await this.db.emailTemplate.updateMany({
      where: { id, organizationId },
      data: {
        ...rest,
        design: this.toInputJsonValue(rest.design),
      },
    });

    if (!result.count) {
      throw new Error("Email template not found");
    }

    await this.db.emailTemplateFile.deleteMany({
      where: { emailTemplateId: id },
    });

    if (fileIds.length > 0) {
      await this.db.emailTemplateFile.createMany({
        data: fileIds.map((fileId) => ({ emailTemplateId: id, fileId })),
      });
    }

    const row = await this.findById(id, organizationId);

    if (!row) {
      throw new Error("Email template not found");
    }

    return row;
  }

  async delete(id: string, organizationId: string): Promise<boolean> {
    const result = await this.db.emailTemplate.deleteMany({
      where: { id, organizationId },
    });

    return result.count > 0;
  }
}
