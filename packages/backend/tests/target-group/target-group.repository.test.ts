import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import type { PrismaClient } from "@prisma/client";
import type {
  UserFactory,
  OrganizationFactory,
} from "@next-phish/database/src/test-db";
import { TargetGroupRepository } from "../../src/target-group/repositories/target-group.repository";
import { getPrisma, getFactories } from "../setup";

describe("TargetGroupRepository", () => {
  let prisma: PrismaClient;
  let repo: TargetGroupRepository;
  let userFactory: UserFactory;
  let orgFactory: OrganizationFactory;
  let orgId: string;
  let userId: string;

  beforeAll(() => {
    prisma = getPrisma();
    repo = new TargetGroupRepository(prisma);
    const factories = getFactories();
    userFactory = factories.user;
    orgFactory = factories.organization;
  });

  beforeEach(async () => {
    const user = await userFactory.createOne();
    const org = await orgFactory.createOne();
    userId = user.id;
    orgId = org.id;
  });

  describe("create", () => {
    it("should create a target group with DRAFT status", async () => {
      const group = await repo.create({
        name: "Test Group",
        status: "DRAFT",
        organizationId: orgId,
        createdById: userId,
      });

      expect(group).toBeDefined();
      expect(group.id).toBeDefined();
      expect(group.name).toBe("Test Group");
      expect(group.status).toBe("DRAFT");
      expect(group.organizationId).toBe(orgId);
      expect(group.createdById).toBe(userId);
      expect(group.userCount).toBe(0);
    });

    it("should create a target group with initial users", async () => {
      const group = await repo.create({
        name: "Group With Users",
        status: "ACTIVE",
        organizationId: orgId,
        createdById: userId,
        users: [
          { email: "user1@test.com", firstName: "John", lastName: "Doe" },
          {
            email: "user2@test.com",
            firstName: "Jane",
            lastName: "Smith",
            position: "Manager",
          },
        ],
      });

      expect(group.userCount).toBe(2);
      expect(group.users).toHaveLength(2);
      expect(group.users[0].email).toBe("user1@test.com");
      expect(group.users[1].position).toBe("Manager");
    });
  });

  describe("findById", () => {
    it("should find an existing target group", async () => {
      const created = await repo.create({
        name: "Find Me",
        status: "DRAFT",
        organizationId: orgId,
        createdById: userId,
      });

      const found = await repo.findById(created.id, orgId);
      expect(found).toBeDefined();
      expect(found!.id).toBe(created.id);
      expect(found!.name).toBe("Find Me");
    });

    it("should return null for non-existent group", async () => {
      const found = await repo.findById("non-existent-id", orgId);
      expect(found).toBeNull();
    });

    it("should not find group from different organization", async () => {
      const otherOrg = await orgFactory.createOne();
      const created = await repo.create({
        name: "Other Org Group",
        status: "DRAFT",
        organizationId: otherOrg.id,
        createdById: userId,
      });

      const found = await repo.findById(created.id, orgId);
      expect(found).toBeNull();
    });
  });

  describe("findByOrganizationId", () => {
    it("should return paginated groups", async () => {
      await repo.create({
        name: "Group A",
        status: "DRAFT",
        organizationId: orgId,
        createdById: userId,
      });
      await repo.create({
        name: "Group B",
        status: "ACTIVE",
        organizationId: orgId,
        createdById: userId,
      });

      const { rows, total } = await repo.findByOrganizationId(orgId, {
        limit: 10,
        offset: 0,
      });

      expect(rows).toHaveLength(2);
      expect(total).toBe(2);
    });

    it("should search by name", async () => {
      await repo.create({
        name: "Engineering Team",
        status: "DRAFT",
        organizationId: orgId,
        createdById: userId,
      });
      await repo.create({
        name: "Marketing Team",
        status: "DRAFT",
        organizationId: orgId,
        createdById: userId,
      });

      const { rows, total } = await repo.findByOrganizationId(orgId, {
        search: "Engineering",
        limit: 10,
        offset: 0,
      });

      expect(rows).toHaveLength(1);
      expect(total).toBe(1);
      expect(rows[0].name).toBe("Engineering Team");
    });

    it("should filter by status", async () => {
      await repo.create({
        name: "Draft Group",
        status: "DRAFT",
        organizationId: orgId,
        createdById: userId,
      });
      await repo.create({
        name: "Active Group",
        status: "ACTIVE",
        organizationId: orgId,
        createdById: userId,
      });

      const { rows, total } = await repo.findByOrganizationId(orgId, {
        limit: 10,
        offset: 0,
        filters: { status: "ACTIVE" },
      });

      expect(rows).toHaveLength(1);
      expect(total).toBe(1);
      expect(rows[0].name).toBe("Active Group");
    });

    it("should handle pagination", async () => {
      for (let i = 0; i < 5; i++) {
        await repo.create({
          name: `Group ${i}`,
          status: "DRAFT",
          organizationId: orgId,
          createdById: userId,
        });
      }

      const page1 = await repo.findByOrganizationId(orgId, {
        limit: 2,
        offset: 0,
      });
      expect(page1.rows).toHaveLength(2);
      expect(page1.total).toBe(5);

      const page2 = await repo.findByOrganizationId(orgId, {
        limit: 2,
        offset: 2,
      });
      expect(page2.rows).toHaveLength(2);

      const page3 = await repo.findByOrganizationId(orgId, {
        limit: 2,
        offset: 4,
      });
      expect(page3.rows).toHaveLength(1);
    });
  });

  describe("update", () => {
    it("should update group name and status", async () => {
      const created = await repo.create({
        name: "Old Name",
        status: "DRAFT",
        organizationId: orgId,
        createdById: userId,
      });

      const result = await repo.update(created.id, orgId, {
        name: "New Name",
        status: "ACTIVE",
      });

      expect(result).toBe(true);

      const found = await repo.findById(created.id, orgId);
      expect(found!.name).toBe("New Name");
      expect(found!.status).toBe("ACTIVE");
    });

    it("should return false for non-existent group", async () => {
      const result = await repo.update("non-existent", orgId, {
        name: "New",
        status: "DRAFT",
      });
      expect(result).toBe(false);
    });
  });

  describe("delete", () => {
    it("should delete group and cascade users", async () => {
      const group = await repo.create({
        name: "To Delete",
        status: "DRAFT",
        organizationId: orgId,
        createdById: userId,
        users: [{ email: "user@test.com", firstName: "John", lastName: "Doe" }],
      });

      const result = await repo.delete(group.id, orgId);
      expect(result).toBe(true);

      const found = await repo.findById(group.id, orgId);
      expect(found).toBeNull();

      const userCount = await prisma.targetGroupUser.count({
        where: { targetGroupId: group.id },
      });
      expect(userCount).toBe(0);
    });
  });

  describe("insertUsers", () => {
    it("should insert users into a group", async () => {
      const group = await repo.create({
        name: "User Group",
        status: "DRAFT",
        organizationId: orgId,
        createdById: userId,
      });

      const count = await repo.insertUsers(group.id, [
        { email: "a@test.com", firstName: "A", lastName: "B" },
        { email: "b@test.com", firstName: "C", lastName: "D", position: "Dev" },
      ]);

      expect(count).toBe(2);
    });

    it("should skip duplicate emails", async () => {
      const group = await repo.create({
        name: "Dup Group",
        status: "DRAFT",
        organizationId: orgId,
        createdById: userId,
      });

      await repo.insertUsers(group.id, [
        { email: "same@test.com", firstName: "A", lastName: "B" },
      ]);

      const count = await repo.insertUsers(group.id, [
        { email: "same@test.com", firstName: "C", lastName: "D" },
        { email: "new@test.com", firstName: "E", lastName: "F" },
      ]);

      expect(count).toBe(1);
    });
  });

  describe("upsertUsers", () => {
    it("should insert new and update existing users", async () => {
      const group = await repo.create({
        name: "Upsert Group",
        status: "DRAFT",
        organizationId: orgId,
        createdById: userId,
        users: [
          {
            email: "existing@test.com",
            firstName: "Old",
            lastName: "Name",
          },
        ],
      });

      const result = await repo.upsertUsers(group.id, [
        {
          email: "existing@test.com",
          firstName: "New",
          lastName: "Name",
          position: "Updated",
        },
        { email: "brand-new@test.com", firstName: "Fresh", lastName: "User" },
      ]);

      expect(result.inserted).toBe(1);
      expect(result.updated).toBe(1);

      const { rows } = await repo.findUsersByGroupId(group.id, {
        limit: 10,
        offset: 0,
      });
      const existing = rows.find((u) => u.email === "existing@test.com");
      expect(existing!.firstName).toBe("New");
      expect(existing!.position).toBe("Updated");
    });
  });

  describe("findUsersByGroupId", () => {
    it("should return paginated users", async () => {
      const group = await repo.create({
        name: "Users Group",
        status: "DRAFT",
        organizationId: orgId,
        createdById: userId,
        users: Array.from({ length: 15 }, (_, i) => ({
          email: `user${i}@test.com`,
          firstName: `First${i}`,
          lastName: `Last${i}`,
        })),
      });

      const { rows, total } = await repo.findUsersByGroupId(group.id, {
        limit: 10,
        offset: 0,
      });

      expect(rows).toHaveLength(10);
      expect(total).toBe(15);
    });

    it("should search users by email, firstName, lastName", async () => {
      const group = await repo.create({
        name: "Search Group",
        status: "DRAFT",
        organizationId: orgId,
        createdById: userId,
        users: [
          {
            email: "john@test.com",
            firstName: "John",
            lastName: "Doe",
          },
          {
            email: "jane@test.com",
            firstName: "Jane",
            lastName: "Smith",
          },
        ],
      });

      const { rows } = await repo.findUsersByGroupId(group.id, {
        search: "john",
        limit: 10,
        offset: 0,
      });

      expect(rows).toHaveLength(1);
      expect(rows[0].email).toBe("john@test.com");
    });
  });
});
