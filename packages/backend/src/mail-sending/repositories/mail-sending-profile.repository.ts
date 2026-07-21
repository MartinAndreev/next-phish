import type { Prisma, PrismaClient } from "@prisma/client";
import type { MailProviderType } from "../providers/mail-provider.types";

export interface MailSendingProfileRow {
  id: string;
  organizationId: string;
  name: string;
  providerType: MailProviderType;
  fromName: string;
  fromEmail: string;
  replyToEmail: string | null;
  headers: Record<string, unknown> | null;
  providerConfig: Record<string, unknown>;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMailSendingProfileData {
  organizationId: string;
  name: string;
  providerType: MailProviderType;
  fromName: string;
  fromEmail: string;
  replyToEmail?: string;
  headers?: Record<string, unknown>;
  providerConfig: Record<string, unknown>;
  isDefault?: boolean;
}

export interface UpdateMailSendingProfileData {
  name?: string;
  fromName?: string;
  fromEmail?: string;
  replyToEmail?: string | null;
  headers?: Record<string, unknown> | null;
  providerConfig?: Record<string, unknown>;
  isDefault?: boolean;
}

interface FindByOrganizationIdInput {
  search?: string;
  limit: number;
  offset: number;
  sort?: Array<{
    field: "name" | "providerType" | "createdAt" | "updatedAt";
    order: "asc" | "desc";
  }>;
}

const listSelect = {
  id: true,
  organizationId: true,
  name: true,
  providerType: true,
  fromName: true,
  fromEmail: true,
  replyToEmail: true,
  headers: true,
  isDefault: true,
  createdAt: true,
  updatedAt: true,
} as const;

const detailSelect = {
  ...listSelect,
  providerConfig: true,
} as const;

export class MailSendingProfileRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByOrganizationId(
    organizationId: string,
    input: FindByOrganizationIdInput,
  ): Promise<{ rows: MailSendingProfileRow[]; total: number }> {
    const where: Prisma.MailSendingProfileWhereInput = {
      organizationId,
      visibility: "CATALOG",
    };

    if (input.search) {
      where.OR = [{ name: { contains: input.search, mode: "insensitive" } }];
    }

    const orderBy = input.sort?.length
      ? input.sort.map((sort) => ({ [sort.field]: sort.order }))
      : [{ updatedAt: "desc" as const }];

    const findManyWhere: Prisma.MailSendingProfileFindManyArgs["where"] = where;

    const rows = await this.db.mailSendingProfile.findMany({
      where: findManyWhere,
      select: listSelect,
      orderBy,
      take: input.limit,
      skip: input.offset,
    });
    const total = await this.db.mailSendingProfile.count({ where });

    return {
      rows: rows as unknown as MailSendingProfileRow[],
      total,
    };
  }

  async findById(
    id: string,
    organizationId: string,
  ): Promise<MailSendingProfileRow | null> {
    const row = await this.db.mailSendingProfile.findFirst({
      where: { id, organizationId, visibility: "CATALOG" },
      select: detailSelect,
    });

    return (row as unknown as MailSendingProfileRow) ?? null;
  }

  async findExecutionById(
    id: string,
    organizationId: string,
  ): Promise<MailSendingProfileRow | null> {
    const row = await this.db.mailSendingProfile.findFirst({
      where: { id, organizationId },
      select: detailSelect,
    });
    return (row as unknown as MailSendingProfileRow) ?? null;
  }

  async findDefault(
    organizationId: string,
  ): Promise<MailSendingProfileRow | null> {
    const row = await this.db.mailSendingProfile.findFirst({
      where: { organizationId, isDefault: true, visibility: "CATALOG" },
      select: detailSelect,
    });

    return (row as unknown as MailSendingProfileRow) ?? null;
  }

  async create(
    data: CreateMailSendingProfileData,
  ): Promise<MailSendingProfileRow> {
    const row = await this.db.mailSendingProfile.create({
      data: data as unknown as Prisma.MailSendingProfileCreateInput,
      select: detailSelect,
    });

    return row as unknown as MailSendingProfileRow;
  }

  async update(
    id: string,
    organizationId: string,
    data: UpdateMailSendingProfileData,
  ): Promise<MailSendingProfileRow | null> {
    const result = await this.db.mailSendingProfile.updateMany({
      where: { id, organizationId, visibility: "CATALOG" },
      data: data as unknown as Prisma.MailSendingProfileUpdateManyMutationInput,
    });

    if (!result.count) {
      return null;
    }

    return this.findById(id, organizationId);
  }

  async delete(id: string, organizationId: string): Promise<boolean> {
    const result = await this.db.mailSendingProfile.deleteMany({
      where: { id, organizationId, visibility: "CATALOG" },
    });

    return result.count > 0;
  }

  async getExecutionConfig(
    id: string,
    organizationId: string,
  ): Promise<Record<string, unknown>> {
    const row = await this.db.mailSendingProfile.findFirst({
      where: { id, organizationId },
      select: { providerConfig: true },
    });
    if (!row) throw new Error(`MailSendingProfile ${id} not found`);
    return row.providerConfig as Record<string, unknown>;
  }

  async getConfig(
    id: string,
    organizationId: string,
  ): Promise<Record<string, unknown>> {
    const row = await this.db.mailSendingProfile.findFirst({
      where: { id, organizationId, visibility: "CATALOG" },
      select: { providerConfig: true },
    });

    if (!row) {
      throw new Error(`MailSendingProfile ${id} not found`);
    }

    return row.providerConfig as Record<string, unknown>;
  }
}
