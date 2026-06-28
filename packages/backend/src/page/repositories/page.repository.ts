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

export class PageRepository {
  constructor(private readonly db: PrismaClient) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toNullableJson(value: unknown): any {
    if (value === null) return Prisma.JsonNull;
    return value as Prisma.InputJsonValue;
  }

  async findByOrganizationId(
    organizationId: string,
    input: FindByOrganizationIdInput,
  ): Promise<{ rows: PageListItemView[]; total: number }> {
    const where: Record<string, unknown> = { organizationId };

    if (input.search) {
      where.OR = [
        { name: { contains: input.search, mode: "insensitive" as const } },
      ];
    }

    if (input.filters?.status) {
      where.status = input.filters.status;
    }

    if (input.filters?.type) {
      where.type = input.filters.type;
    }

    const orderBy = input.sort?.length
      ? input.sort.map((sort) => ({ [sort.field]: sort.order }))
      : [{ updatedAt: "desc" as const }];

    const [rows, total] = await Promise.all([
      this.db.page.findMany({
        where,
        include: { createdBy: true },
        orderBy,
        take: input.limit,
        skip: input.offset,
      }),
      this.db.page.count({ where }),
    ]);

    return { rows: rows as PageListItemView[], total };
  }

  async findById(id: string, organizationId: string): Promise<PageView | null> {
    return this.db.page.findFirst({
      where: { id, organizationId },
      include: { createdBy: true },
    }) as Promise<PageView | null>;
  }

  async create(data: CreatePageData): Promise<PageView> {
    const row = await this.db.page.create({
      data: {
        name: data.name,
        type: data.type,
        html: data.html,
        design: data.design
          ? this.toNullableJson(data.design)
          : Prisma.JsonNull,
        status: data.status,
        captureData: data.captureData,
        redirectUrl: data.redirectUrl,
        redirectPageId: data.redirectPageId,
        organizationId: data.organizationId,
        createdById: data.createdById,
      },
      include: { createdBy: true },
    });

    return row as unknown as PageView;
  }

  async update(
    id: string,
    organizationId: string,
    data: UpdatePageData,
  ): Promise<PageView> {
    const result = await this.db.page.updateMany({
      where: { id, organizationId },
      data: {
        name: data.name,
        type: data.type,
        html: data.html,
        design: data.design
          ? this.toNullableJson(data.design)
          : Prisma.JsonNull,
        status: data.status,
        captureData: data.captureData,
        redirectUrl: data.redirectUrl,
        redirectPageId: data.redirectPageId,
      },
    });

    if (!result.count) {
      throw new Error("Page not found");
    }

    const row = await this.findById(id, organizationId);

    if (!row) {
      throw new Error("Page not found");
    }

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
      where: { id, organizationId },
    });

    return result.count > 0;
  }
}
