import { beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { UserRepository } from "../../src/user";
import { getFactories, getPrisma } from "../setup";

describe("UserRepository", () => {
  let db: PrismaClient;
  let repository: UserRepository;

  beforeAll(() => {
    db = getPrisma();
    repository = new UserRepository(db);
  });

  it("creates an invited user with a one-time magic link and optional membership", async () => {
    const organization = await getFactories().organization.createOne();
    const result = await repository.create({
      name: "Invited User",
      email: "invited@example.com",
      role: "user",
      organizationMode: "existing",
      organizationId: organization.id,
    });

    expect(result.user.passwordSetupRequired).toBe(true);
    expect(result.user.organizations).toEqual([
      expect.objectContaining({ id: organization.id, role: "member" }),
    ]);
    expect(result.welcomeJob.magicLink).toContain(
      "/api/auth/magic-link/verify",
    );
    expect(await db.verification.count()).toBe(1);
  });

  it("keeps orphaned members after deleting an owner and their organization", async () => {
    const owner = await getFactories().user.createOne();
    const orphan = await getFactories().user.createOne();
    const organization = await getFactories().organization.createOne();
    await db.member.createMany({
      data: [
        { organizationId: organization.id, userId: owner.id, role: "owner" },
        { organizationId: organization.id, userId: orphan.id, role: "member" },
      ],
    });

    const preview = await repository.getDeletionPreview(owner.id);
    expect(preview.ownedOrganizations).toHaveLength(1);
    expect(preview.orphanedUsers.map((user) => user.id)).toContain(orphan.id);

    await repository.delete(owner.id, "keep");
    expect(
      await db.organization.findUnique({ where: { id: organization.id } }),
    ).toBeNull();
    expect(await db.user.findUnique({ where: { id: owner.id } })).toBeNull();
    expect(
      await db.user.findUnique({ where: { id: orphan.id } }),
    ).not.toBeNull();
    expect(await db.member.count({ where: { userId: orphan.id } })).toBe(0);
  });

  it("can delete users orphaned by an owned organization", async () => {
    const owner = await getFactories().user.createOne();
    const orphan = await getFactories().user.createOne();
    const organization = await getFactories().organization.createOne();
    await db.member.createMany({
      data: [
        { organizationId: organization.id, userId: owner.id, role: "owner" },
        { organizationId: organization.id, userId: orphan.id, role: "member" },
      ],
    });

    await repository.delete(owner.id, "delete");
    expect(
      await db.user.count({ where: { id: { in: [owner.id, orphan.id] } } }),
    ).toBe(0);
  });
});
