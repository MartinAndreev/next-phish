import { randomBytes, randomUUID } from "node:crypto";
import type { PrismaClient } from "@next-phish/database";
import type {
  CreateUserData,
  OrphanUserAction,
  UserDeletionPreview,
  UserView,
  WelcomeUserJob,
} from "../types";
import type { ListUsersInput } from "../validations";

const userViewSelect = {
  id: true,
  name: true,
  email: true,
  emailVerified: true,
  role: true,
  passwordSetupRequired: true,
  disabledAt: true,
  createdAt: true,
  updatedAt: true,
  members: {
    select: {
      role: true,
      organization: { select: { id: true, name: true } },
    },
  },
} as const;

type SelectedUser = Awaited<ReturnType<UserRepository["findSelectedById"]>>;

export class UserRepository {
  constructor(private readonly db: PrismaClient) {}

  private async findSelectedById(id: string) {
    return this.db.user.findUnique({ where: { id }, select: userViewSelect });
  }

  private toView(user: NonNullable<SelectedUser>): UserView {
    const organizations = user.members.map((member) => ({
      id: member.organization.id,
      name: member.organization.name,
      role: member.role,
    }));

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      role: user.role,
      passwordSetupRequired: user.passwordSetupRequired,
      disabledAt: user.disabledAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      organizations,
      ownedOrganizationCount: organizations.filter(
        (org) => org.role === "owner",
      ).length,
    };
  }

  async findById(id: string): Promise<UserView | null> {
    const user = await this.findSelectedById(id);
    return user ? this.toView(user) : null;
  }

  async findByEmail(email: string): Promise<UserView | null> {
    const user = await this.db.user.findUnique({
      where: { email },
      select: userViewSelect,
    });
    return user ? this.toView(user) : null;
  }

  async count(): Promise<number> {
    return this.db.user.count();
  }

  async list(
    input: ListUsersInput,
  ): Promise<{ users: UserView[]; total: number }> {
    const where = {
      ...(input.search
        ? {
            OR: [
              {
                name: { contains: input.search, mode: "insensitive" as const },
              },
              {
                email: { contains: input.search, mode: "insensitive" as const },
              },
            ],
          }
        : {}),
      ...(input.filters?.role ? { role: input.filters.role } : {}),
      ...(input.filters?.status === "disabled"
        ? { disabledAt: { not: null } }
        : input.filters?.status === "pending"
          ? { disabledAt: null, passwordSetupRequired: true }
          : input.filters?.status === "active"
            ? { disabledAt: null, passwordSetupRequired: false }
            : {}),
    };
    const orderBy = input.sort?.length
      ? input.sort.map((sort) => ({ [sort.field]: sort.order }))
      : [{ createdAt: "desc" as const }];
    const [rows, total] = await Promise.all([
      this.db.user.findMany({
        where,
        select: userViewSelect,
        orderBy,
        take: input.limit,
        skip: input.offset,
      }),
      this.db.user.count({ where }),
    ]);
    return { users: rows.map((user) => this.toView(user)), total };
  }

  async create(
    data: CreateUserData,
  ): Promise<{ user: UserView; welcomeJob: WelcomeUserJob }> {
    const token = randomBytes(32).toString("base64url");
    const id = randomUUID();
    const appUrl = (process.env.APP_URL ?? "http://localhost:3000").replace(
      /\/$/,
      "",
    );
    const callbackURL = "/initial-password";
    const magicLink = `${appUrl}/api/auth/magic-link/verify?token=${encodeURIComponent(token)}&callbackURL=${encodeURIComponent(callbackURL)}`;

    const user = await this.db.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          id,
          name: data.name,
          email: data.email,
          role: data.role,
          emailVerified: false,
          passwordSetupRequired: true,
          ...(data.organizationMode === "existing" && data.organizationId
            ? {
                members: {
                  create: {
                    organizationId: data.organizationId,
                    role: "member",
                  },
                },
              }
            : {}),
        },
        select: userViewSelect,
      });
      await tx.verification.create({
        data: {
          id: randomUUID(),
          identifier: token,
          value: JSON.stringify({ email: data.email, name: data.name }),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
      return created;
    });

    return {
      user: this.toView(user),
      welcomeJob: { userId: id, name: data.name, email: data.email, magicLink },
    };
  }

  async setDisabled(userId: string, disabled: boolean): Promise<void> {
    await this.db.$transaction([
      this.db.user.update({
        where: { id: userId },
        data: { disabledAt: disabled ? new Date() : null },
      }),
      this.db.session.deleteMany({ where: { userId } }),
    ]);
  }

  async markPasswordConfigured(userId: string): Promise<void> {
    await this.db.user.update({
      where: { id: userId },
      data: { passwordSetupRequired: false, emailVerified: true },
    });
  }

  async getDeletionPreview(userId: string): Promise<UserDeletionPreview> {
    const ownedOrganizations = await this.db.organization.findMany({
      where: { members: { some: { userId, role: "owner" } } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    const ownedIds = ownedOrganizations.map((org) => org.id);
    const candidates = ownedIds.length
      ? await this.db.user.findMany({
          where: {
            id: { not: userId },
            members: { some: { organizationId: { in: ownedIds } } },
          },
          select: {
            id: true,
            name: true,
            email: true,
            members: { select: { organizationId: true } },
          },
        })
      : [];
    const orphanedUsers = candidates
      .filter((candidate) =>
        candidate.members.every((member) =>
          ownedIds.includes(member.organizationId),
        ),
      )
      .map(({ id, name, email }) => ({ id, name, email }));

    return {
      userId,
      ownedOrganizations,
      orphanedUsers,
      hasActiveData: ownedOrganizations.length > 0,
    };
  }

  async delete(userId: string, orphanAction: OrphanUserAction): Promise<void> {
    const preview = await this.getDeletionPreview(userId);
    const deleteUserIds = [
      userId,
      ...(orphanAction === "delete"
        ? preview.orphanedUsers.map((user) => user.id)
        : []),
    ];
    const ownedOrganizationIds = preview.ownedOrganizations.map(
      (org) => org.id,
    );

    await this.db.$transaction(async (tx) => {
      const organizationWhere = {
        organizationId: { notIn: ownedOrganizationIds },
        createdById: { in: deleteUserIds },
      };
      const [memberships, ...authoredGroups] = await Promise.all([
        tx.member.findMany({
          where: {
            userId: { in: deleteUserIds },
            organizationId: { notIn: ownedOrganizationIds },
          },
          select: { organizationId: true },
          distinct: ["organizationId"],
        }),
        tx.emailTemplate.findMany({
          where: organizationWhere,
          select: { organizationId: true },
          distinct: ["organizationId"],
        }),
        tx.page.findMany({
          where: organizationWhere,
          select: { organizationId: true },
          distinct: ["organizationId"],
        }),
        tx.job.findMany({
          where: organizationWhere,
          select: { organizationId: true },
          distinct: ["organizationId"],
        }),
        tx.siteImport.findMany({
          where: organizationWhere,
          select: { organizationId: true },
          distinct: ["organizationId"],
        }),
        tx.targetGroup.findMany({
          where: organizationWhere,
          select: { organizationId: true },
          distinct: ["organizationId"],
        }),
        tx.campaign.findMany({
          where: organizationWhere,
          select: { organizationId: true },
          distinct: ["organizationId"],
        }),
        tx.schedule.findMany({
          where: organizationWhere,
          select: { organizationId: true },
          distinct: ["organizationId"],
        }),
        tx.ignoredNetwork.findMany({
          where: organizationWhere,
          select: { organizationId: true },
          distinct: ["organizationId"],
        }),
        tx.task.findMany({
          where: organizationWhere,
          select: { organizationId: true },
          distinct: ["organizationId"],
        }),
        tx.ignoredNetworkAudit.findMany({
          where: {
            organizationId: { notIn: ownedOrganizationIds },
            actorId: { in: deleteUserIds },
          },
          select: { organizationId: true },
          distinct: ["organizationId"],
        }),
      ]);
      const survivingOrganizationIds = new Set<string>(
        [
          ...memberships.map((row) => row.organizationId),
          ...authoredGroups.flatMap((rows) =>
            rows.map((row) => row.organizationId),
          ),
        ].filter((organizationId): organizationId is string =>
          Boolean(organizationId),
        ),
      );

      for (const organizationId of survivingOrganizationIds) {
        const replacements = await tx.member.findMany({
          where: { organizationId, userId: { notIn: deleteUserIds } },
          select: { userId: true, role: true },
        });
        const replacement = replacements.sort((a, b) => {
          const rank = (role: string) =>
            role === "owner" ? 0 : role === "admin" ? 1 : 2;
          return rank(a.role) - rank(b.role);
        })[0];
        if (!replacement)
          throw new Error(
            "Cannot delete the only user of a surviving organization",
          );
        const authorWhere = {
          organizationId,
          createdById: { in: deleteUserIds },
        };
        await Promise.all([
          tx.emailTemplate.updateMany({
            where: authorWhere,
            data: { createdById: replacement.userId },
          }),
          tx.page.updateMany({
            where: authorWhere,
            data: { createdById: replacement.userId },
          }),
          tx.job.updateMany({
            where: authorWhere,
            data: { createdById: replacement.userId },
          }),
          tx.siteImport.updateMany({
            where: authorWhere,
            data: { createdById: replacement.userId },
          }),
          tx.targetGroup.updateMany({
            where: authorWhere,
            data: { createdById: replacement.userId },
          }),
          tx.campaign.updateMany({
            where: authorWhere,
            data: { createdById: replacement.userId },
          }),
          tx.schedule.updateMany({
            where: authorWhere,
            data: { createdById: replacement.userId },
          }),
          tx.ignoredNetwork.updateMany({
            where: authorWhere,
            data: { createdById: replacement.userId },
          }),
          tx.task.updateMany({
            where: authorWhere,
            data: { createdById: replacement.userId },
          }),
          tx.ignoredNetworkAudit.updateMany({
            where: { organizationId, actorId: { in: deleteUserIds } },
            data: { actorId: replacement.userId },
          }),
        ]);
      }

      const globalNetworks = await tx.ignoredNetwork.count({
        where: { organizationId: null, createdById: { in: deleteUserIds } },
      });
      if (globalNetworks > 0) {
        const replacementAdmin = await tx.user.findFirst({
          where: {
            id: { notIn: deleteUserIds },
            role: "admin",
            disabledAt: null,
          },
          orderBy: { createdAt: "asc" },
          select: { id: true },
        });
        if (!replacementAdmin) {
          throw new Error(
            "Cannot delete the only administrator responsible for global settings",
          );
        }
        await tx.ignoredNetwork.updateMany({
          where: { organizationId: null, createdById: { in: deleteUserIds } },
          data: { createdById: replacementAdmin.id },
        });
      }

      if (ownedOrganizationIds.length) {
        await tx.organization.deleteMany({
          where: { id: { in: ownedOrganizationIds } },
        });
      }
      await tx.user.deleteMany({ where: { id: { in: deleteUserIds } } });
    });
  }
}
