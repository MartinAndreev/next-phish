import type { PrismaClient } from "@next-phish/database";
import type { OrganizationWithMembers } from "../types";

const memberSelect = {
  id: true,
  userId: true,
  role: true,
  createdAt: true,
} as const;

interface FindByUserIdInput {
  search?: string;
  limit: number;
  offset: number;
  sort?: Array<{ field: string; order: "asc" | "desc" }>;
  filters?: { role?: string };
}

export class OrganizationRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByUserId(
    userId: string,
    input: FindByUserIdInput,
  ): Promise<{ rows: OrganizationWithMembers[]; total: number }> {
    const where: Record<string, unknown> = {
      members: { some: { userId } },
    };

    if (input.search) {
      where.name = { contains: input.search, mode: "insensitive" as const };
    }

    if (input.filters?.role) {
      where.members = {
        some: {
          userId,
          role: input.filters.role,
        },
      };
    }

    const orderBy = input.sort?.length
      ? input.sort.map((s) => ({ [s.field]: s.order }))
      : [{ name: "asc" as const }];

    const [rows, total] = await Promise.all([
      this.db.organization.findMany({
        where,
        include: {
          members: { where: { userId }, select: memberSelect },
        },
        orderBy,
        take: input.limit,
        skip: input.offset,
      }),
      this.db.organization.count({ where }),
    ]);

    return { rows: rows as OrganizationWithMembers[], total };
  }

  async findById(id: string): Promise<OrganizationWithMembers | null> {
    return this.db.organization.findUnique({
      where: { id },
      include: {
        members: { select: memberSelect },
      },
    }) as Promise<OrganizationWithMembers | null>;
  }

  async findFirstByUserId(
    userId: string,
  ): Promise<{ organizationId: string } | null> {
    return this.db.member.findFirst({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: { organizationId: true },
    });
  }
}
