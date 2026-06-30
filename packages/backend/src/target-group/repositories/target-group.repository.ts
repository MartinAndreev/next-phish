import type { Prisma, PrismaClient } from "@prisma/client";
import type {
  CreateTargetGroupData,
  TargetGroupListItemView,
  TargetGroupView,
  TargetGroupUserView,
  UpdateTargetGroupData,
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
    status?: "DRAFT" | "ACTIVE" | "ARCHIVED";
  };
}

interface FindUsersByGroupIdInput {
  search?: string;
  limit: number;
  offset: number;
}

const authorSelect = {
  id: true,
  name: true,
  email: true,
} as const;

const listSelect = {
  id: true,
  name: true,
  status: true,
  organizationId: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  createdBy: { select: authorSelect },
  _count: { select: { users: true } },
} as const;

const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  position: true,
} as const;

const detailSelect = {
  ...listSelect,
  users: {
    select: userSelect,
    orderBy: { email: "asc" as const },
  },
} as const;

export class TargetGroupRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByOrganizationId(
    organizationId: string,
    input: FindByOrganizationIdInput,
  ): Promise<{ rows: TargetGroupListItemView[]; total: number }> {
    const where: Record<string, unknown> = { organizationId };

    if (input.search) {
      where.name = { contains: input.search, mode: "insensitive" as const };
    }

    if (input.filters?.status) {
      where.status = input.filters.status;
    }

    const orderBy = input.sort?.length
      ? input.sort.map((sort) => ({ [sort.field]: sort.order }))
      : [{ updatedAt: "desc" as const }];

    const rows = await this.db.targetGroup.findMany({
      where,
      select: listSelect,
      orderBy,
      take: input.limit,
      skip: input.offset,
    });

    const total = await this.db.targetGroup.count({ where });

    const mapped = rows.map((row) => ({
      ...row,
      userCount: row._count.users,
    }));

    return { rows: mapped as TargetGroupListItemView[], total };
  }

  async findById(
    id: string,
    organizationId: string,
  ): Promise<TargetGroupView | null> {
    const row = await this.db.targetGroup.findFirst({
      where: { id, organizationId },
      select: detailSelect,
    });

    if (!row) return null;

    return {
      ...row,
      userCount: row._count.users,
      users: row.users as TargetGroupUserView[],
    } as TargetGroupView;
  }

  async findUsersByGroupId(
    targetGroupId: string,
    input: FindUsersByGroupIdInput,
  ): Promise<{ rows: TargetGroupUserView[]; total: number }> {
    const where: Prisma.TargetGroupUserWhereInput = { targetGroupId };

    if (input.search) {
      where.OR = [
        { email: { contains: input.search, mode: "insensitive" } },
        { firstName: { contains: input.search, mode: "insensitive" } },
        { lastName: { contains: input.search, mode: "insensitive" } },
      ];
    }

    const rows = await this.db.targetGroupUser.findMany({
      where,
      select: userSelect,
      orderBy: { email: "asc" },
      take: input.limit,
      skip: input.offset,
    });

    const total = await this.db.targetGroupUser.count({ where });

    return { rows: rows as TargetGroupUserView[], total };
  }

  async create(data: CreateTargetGroupData): Promise<TargetGroupView> {
    const row = await this.db.targetGroup.create({
      data: {
        name: data.name,
        status: data.status,
        organizationId: data.organizationId,
        createdById: data.createdById,
        users: data.users
          ? {
              create: data.users.map((u) => ({
                email: u.email,
                firstName: u.firstName,
                lastName: u.lastName,
                position: u.position ?? null,
              })),
            }
          : undefined,
      },
      select: detailSelect,
    });

    return {
      ...row,
      userCount: row._count.users,
      users: row.users as TargetGroupUserView[],
    } as TargetGroupView;
  }

  async update(
    id: string,
    organizationId: string,
    data: UpdateTargetGroupData,
  ): Promise<boolean> {
    const result = await this.db.targetGroup.updateMany({
      where: { id, organizationId },
      data: {
        name: data.name,
        status: data.status,
      },
    });

    return result.count > 0;
  }

  async delete(id: string, organizationId: string): Promise<boolean> {
    const result = await this.db.targetGroup.deleteMany({
      where: { id, organizationId },
    });

    return result.count > 0;
  }

  async insertUsers(
    targetGroupId: string,
    users: Array<{
      email: string;
      firstName: string;
      lastName: string;
      position?: string;
    }>,
  ): Promise<number> {
    if (users.length === 0) return 0;

    const result = await this.db.targetGroupUser.createMany({
      data: users.map((u) => ({
        targetGroupId,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        position: u.position ?? null,
      })),
      skipDuplicates: true,
    });

    return result.count;
  }

  async upsertUsers(
    targetGroupId: string,
    users: Array<{
      email: string;
      firstName: string;
      lastName: string;
      position?: string;
    }>,
  ): Promise<{ inserted: number; updated: number }> {
    if (users.length === 0) return { inserted: 0, updated: 0 };

    let inserted = 0;
    let updated = 0;

    for (const user of users) {
      const existing = await this.db.targetGroupUser.findUnique({
        where: {
          targetGroupId_email: {
            targetGroupId,
            email: user.email,
          },
        },
      });

      if (existing) {
        await this.db.targetGroupUser.update({
          where: { id: existing.id },
          data: {
            firstName: user.firstName,
            lastName: user.lastName,
            position: user.position ?? null,
          },
        });
        updated++;
      } else {
        await this.db.targetGroupUser.create({
          data: {
            targetGroupId,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            position: user.position ?? null,
          },
        });
        inserted++;
      }
    }

    return { inserted, updated };
  }

  async loadUsersByEmailMap(
    targetGroupId: string,
    emails: string[],
  ): Promise<Map<string, { id: string; email: string }>> {
    const map = new Map<string, { id: string; email: string }>();
    const chunkSize = 1000;

    for (let i = 0; i < emails.length; i += chunkSize) {
      const chunk = emails.slice(i, i + chunkSize);
      const users = await this.db.targetGroupUser.findMany({
        where: {
          targetGroupId,
          email: { in: chunk },
        },
        select: { id: true, email: true },
      });

      for (const user of users) {
        map.set(user.email, user);
      }
    }

    return map;
  }

  async addUser(
    targetGroupId: string,
    data: {
      email: string;
      firstName: string;
      lastName: string;
      position?: string;
    },
  ): Promise<TargetGroupUserView> {
    const row = await this.db.targetGroupUser.create({
      data: {
        targetGroupId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        position: data.position ?? null,
      },
      select: userSelect,
    });

    return row as TargetGroupUserView;
  }

  async updateUser(
    id: string,
    targetGroupId: string,
    data: {
      email: string;
      firstName: string;
      lastName: string;
      position?: string;
    },
  ): Promise<TargetGroupUserView> {
    const row = await this.db.targetGroupUser.update({
      where: { id, targetGroupId },
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        position: data.position ?? null,
      },
      select: userSelect,
    });

    return row as TargetGroupUserView;
  }

  async deleteUser(id: string, targetGroupId: string): Promise<boolean> {
    const result = await this.db.targetGroupUser.deleteMany({
      where: { id, targetGroupId },
    });

    return result.count > 0;
  }
}
