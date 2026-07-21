import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import type {
  CreatePageData,
  PageListItemView,
  PageView,
  UpdatePageData,
} from "../types";
import type { EncryptedPayload } from "../../encryption";

interface FindByOrganizationIdInput {
  search?: string;
  selectedId?: string;
  includeContent?: boolean;
  limit: number;
  offset: number;
  sort?: Array<{
    field: "name" | "type" | "status" | "createdAt" | "updatedAt";
    order: "asc" | "desc";
  }>;
  filters?: {
    status?: "DRAFT" | "ACTIVE";
    type?: "LANDING" | "REDIRECT";
  };
}

const previewSelect = {
  id: true,
  status: true,
  sourceRevision: true,
} as const;

function withPreviewUrl<
  T extends {
    preview: {
      id: string;
      status: "MISSING" | "PENDING" | "READY" | "FAILED" | "STALE";
      sourceRevision: number;
    } | null;
  },
>(row: T) {
  return {
    ...row,
    preview: row.preview
      ? { ...row.preview, url: `/api/catalog-previews/${row.preview.id}` }
      : null,
  };
}

export class PageRepository {
  constructor(private readonly db: PrismaClient) {}

  private toInputJsonValue(value: unknown): Prisma.InputJsonValue {
    return value as Prisma.InputJsonValue;
  }

  async findByOrganizationId(
    organizationId: string,
    input: FindByOrganizationIdInput,
  ): Promise<{ rows: PageListItemView[]; total: number }> {
    const baseWhere: Prisma.PageWhereInput = {
      organizationId,
      visibility: "CATALOG",
      status: input.filters?.status,
      type: input.filters?.type,
    };
    const selected = input.selectedId
      ? await this.db.page.findFirst({
          where: {
            id: input.selectedId,
            organizationId,
            visibility: "CATALOG",
          },
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            organizationId: true,
            createdById: true,
            createdAt: true,
            updatedAt: true,
            contentRevision: true,
            html: input.includeContent,
            createdBy: true,
            preview: { select: previewSelect },
          },
        })
      : null;
    const where: Prisma.PageWhereInput = {
      ...baseWhere,
      id: selected ? { not: selected.id } : undefined,
      name: input.search
        ? { contains: input.search, mode: "insensitive" }
        : undefined,
    };
    const orderBy = input.sort?.length
      ? input.sort.map((sort) => ({ [sort.field]: sort.order }))
      : [{ updatedAt: "desc" as const }];
    const includeSelected = Boolean(selected && input.offset === 0);
    const take = Math.max(0, input.limit - (includeSelected ? 1 : 0));
    const [rows, regularTotal] = await Promise.all([
      take
        ? this.db.page.findMany({
            where,
            select: {
              id: true,
              name: true,
              type: true,
              status: true,
              organizationId: true,
              createdById: true,
              createdAt: true,
              updatedAt: true,
              contentRevision: true,
              html: input.includeContent,
              createdBy: true,
              preview: { select: previewSelect },
            },
            orderBy,
            take,
            skip: selected ? Math.max(0, input.offset - 1) : input.offset,
          })
        : Promise.resolve([]),
      this.db.page.count({ where }),
    ]);
    const orderedRows = includeSelected ? [selected!, ...rows] : rows;

    return {
      rows: orderedRows.map(withPreviewUrl) as unknown as PageListItemView[],
      total: regularTotal + (selected ? 1 : 0),
    };
  }

  async findById(id: string, organizationId: string): Promise<PageView | null> {
    const row = await this.db.page.findFirst({
      where: { id, organizationId, visibility: "CATALOG" },
      include: { createdBy: true, preview: { select: previewSelect } },
    });
    return row ? (withPreviewUrl(row) as unknown as PageView) : null;
  }

  async create(data: CreatePageData): Promise<PageView> {
    const row = await this.db.$transaction(async (tx) => {
      if (data.redirectPageId) {
        const redirect = await tx.page.findFirst({
          where: {
            id: data.redirectPageId,
            organizationId: data.organizationId,
            visibility: "CATALOG",
          },
          select: { id: true },
        });
        if (!redirect) throw new Error("Redirect page is unavailable");
      }

      return tx.page.create({
        data: {
          name: data.name,
          type: data.type,
          html: data.html,
          design: this.toInputJsonValue(data.design ?? {}),
          status: data.status,
          captureData: data.captureData,
          redirectUrl: data.redirectUrl,
          redirectPageId: data.redirectPageId,
          organizationId: data.organizationId,
          createdById: data.createdById,
        },
        include: { createdBy: true, preview: { select: previewSelect } },
      });
    });

    return withPreviewUrl(row) as unknown as PageView;
  }

  async update(
    id: string,
    organizationId: string,
    data: UpdatePageData,
  ): Promise<PageView> {
    await this.db.$transaction(async (tx) => {
      if (data.redirectPageId) {
        const redirect = await tx.page.findFirst({
          where: {
            id: data.redirectPageId,
            organizationId,
            visibility: "CATALOG",
          },
          select: { id: true },
        });
        if (!redirect || redirect.id === id)
          throw new Error("Redirect page is unavailable");
      }
      const result = await tx.page.updateMany({
        where: { id, organizationId, visibility: "CATALOG" },
        data: {
          name: data.name,
          type: data.type,
          html: data.html,
          design: this.toInputJsonValue(data.design ?? {}),
          status: data.status,
          captureData: data.captureData,
          redirectUrl: data.redirectUrl,
          redirectPageId: data.redirectPageId,
          contentRevision: { increment: 1 },
        },
      });
      if (!result.count) throw new Error("Page not found");
      await tx.catalogPreview.updateMany({
        where: { pageId: id },
        data: { status: "STALE" },
      });
    });

    const row = await this.findById(id, organizationId);
    if (!row) throw new Error("Page not found");
    return row;
  }

  async findByPublicId(id: string): Promise<PageView | null> {
    return this.db.page.findUnique({
      where: { id },
      include: { createdBy: true },
    }) as Promise<PageView | null>;
  }

  async createSubmission(data: {
    pageId: string;
    encryptedData: EncryptedPayload;
    ipAddress: string | null;
    userAgent: string | null;
  }): Promise<string> {
    const row = await this.db.pageSubmission.create({
      data: {
        pageId: data.pageId,
        data: data.encryptedData as unknown as Prisma.InputJsonValue,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });

    return row.id;
  }

  async delete(id: string, organizationId: string): Promise<boolean> {
    const result = await this.db.page.deleteMany({
      where: { id, organizationId, visibility: "CATALOG" },
    });

    return result.count > 0;
  }
}
