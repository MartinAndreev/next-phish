import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { TargetGroupRepository } from "../../../src/target-group/repositories/target-group.repository";
import { TargetGroupService } from "../../../src/target-group/services/target-group.service";
import { GetTargetGroupsQuery } from "../../../src/target-group/queries/get-target-groups.query";
import { GetTargetGroupByIdQuery } from "../../../src/target-group/queries/get-target-group-by-id.query";
import { GetTargetGroupUsersQuery } from "../../../src/target-group/queries/get-target-group-users.query";
import { getPrisma, getFactories } from "../../setup";

describe("TargetGroup Queries", () => {
  let prisma: PrismaClient;
  let repo: TargetGroupRepository;
  let service: TargetGroupService;
  let listQuery: GetTargetGroupsQuery;
  let getByIdQuery: GetTargetGroupByIdQuery;
  let getUsersQuery: GetTargetGroupUsersQuery;
  let orgId: string;
  let userId: string;

  beforeAll(() => {
    prisma = getPrisma();
    repo = new TargetGroupRepository(prisma);
    service = new TargetGroupService();
    listQuery = new GetTargetGroupsQuery(repo, service);
    getByIdQuery = new GetTargetGroupByIdQuery(repo, service);
    getUsersQuery = new GetTargetGroupUsersQuery(repo, service);
  });

  beforeEach(async () => {
    const factories = getFactories();
    const user = await factories.user.createOne();
    const org = await factories.organization.createOne();
    userId = user.id;
    orgId = org.id;
  });

  describe("GetTargetGroupsQuery", () => {
    it("should return paginated target groups", async () => {
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

      const result = await listQuery.execute({
        organizationId: orgId,
        limit: 10,
        offset: 0,
      });

      expect(result.targetGroups).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it("should search by name", async () => {
      await repo.create({
        name: "Engineering",
        status: "DRAFT",
        organizationId: orgId,
        createdById: userId,
      });
      await repo.create({
        name: "Marketing",
        status: "DRAFT",
        organizationId: orgId,
        createdById: userId,
      });

      const result = await listQuery.execute({
        organizationId: orgId,
        search: "Engineering",
        limit: 10,
        offset: 0,
      });

      expect(result.targetGroups).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.targetGroups[0].name).toBe("Engineering");
    });

    it("should filter by status", async () => {
      await repo.create({
        name: "Draft",
        status: "DRAFT",
        organizationId: orgId,
        createdById: userId,
      });
      await repo.create({
        name: "Active",
        status: "ACTIVE",
        organizationId: orgId,
        createdById: userId,
      });

      const result = await listQuery.execute({
        organizationId: orgId,
        filters: { status: "ACTIVE" },
        limit: 10,
        offset: 0,
      });

      expect(result.targetGroups).toHaveLength(1);
      expect(result.targetGroups[0].status).toBe("ACTIVE");
    });
  });

  describe("GetTargetGroupByIdQuery", () => {
    it("should return a target group by id", async () => {
      const created = await repo.create({
        name: "Find Me",
        status: "DRAFT",
        organizationId: orgId,
        createdById: userId,
      });

      const result = await getByIdQuery.execute({
        id: created.id,
        organizationId: orgId,
      });

      expect(result).toBeDefined();
      expect(result!.id).toBe(created.id);
      expect(result!.name).toBe("Find Me");
    });

    it("should return null for non-existent group", async () => {
      const result = await getByIdQuery.execute({
        id: "non-existent",
        organizationId: orgId,
      });

      expect(result).toBeNull();
    });
  });

  describe("GetTargetGroupUsersQuery", () => {
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

      const result = await getUsersQuery.execute({
        targetGroupId: group.id,
        limit: 10,
        offset: 0,
      });

      expect(result.users).toHaveLength(10);
      expect(result.total).toBe(15);
    });

    it("should search users", async () => {
      const group = await repo.create({
        name: "Search Group",
        status: "DRAFT",
        organizationId: orgId,
        createdById: userId,
        users: [
          { email: "john@test.com", firstName: "John", lastName: "Doe" },
          { email: "jane@test.com", firstName: "Jane", lastName: "Smith" },
        ],
      });

      const result = await getUsersQuery.execute({
        targetGroupId: group.id,
        search: "john",
        limit: 10,
        offset: 0,
      });

      expect(result.users).toHaveLength(1);
      expect(result.users[0].email).toBe("john@test.com");
    });

    it("should return empty for group with no users", async () => {
      const group = await repo.create({
        name: "Empty Group",
        status: "DRAFT",
        organizationId: orgId,
        createdById: userId,
      });

      const result = await getUsersQuery.execute({
        targetGroupId: group.id,
        limit: 10,
        offset: 0,
      });

      expect(result.users).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });
});
