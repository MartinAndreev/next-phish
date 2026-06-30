import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { TargetGroupRepository } from "../../../src/target-group/repositories/target-group.repository";
import { TargetGroupService } from "../../../src/target-group/services/target-group.service";
import { CreateTargetGroupCommand } from "../../../src/target-group/commands/create-target-group.command";
import { UpdateTargetGroupCommand } from "../../../src/target-group/commands/update-target-group.command";
import { DeleteTargetGroupCommand } from "../../../src/target-group/commands/delete-target-group.command";
import { getPrisma, getFactories } from "../../setup";

describe("TargetGroup Commands", () => {
  let prisma: PrismaClient;
  let repo: TargetGroupRepository;
  let service: TargetGroupService;
  let createCmd: CreateTargetGroupCommand;
  let updateCmd: UpdateTargetGroupCommand;
  let deleteCmd: DeleteTargetGroupCommand;
  let orgId: string;
  let userId: string;

  beforeAll(() => {
    prisma = getPrisma();
    repo = new TargetGroupRepository(prisma);
    service = new TargetGroupService();
    createCmd = new CreateTargetGroupCommand(repo, service);
    updateCmd = new UpdateTargetGroupCommand(repo);
    deleteCmd = new DeleteTargetGroupCommand(repo);
  });

  beforeEach(async () => {
    const factories = getFactories();
    const user = await factories.user.createOne();
    const org = await factories.organization.createOne();
    userId = user.id;
    orgId = org.id;
  });

  describe("CreateTargetGroupCommand", () => {
    it("should create a target group", async () => {
      const result = await createCmd.execute({
        name: "Test Group",
        status: "DRAFT",
        organizationId: orgId,
        createdById: userId,
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe("Test Group");
      expect(result.status).toBe("DRAFT");
      expect(result.userCount).toBe(0);
    });

    it("should create a group with users", async () => {
      const result = await createCmd.execute({
        name: "Group With Users",
        status: "ACTIVE",
        organizationId: orgId,
        createdById: userId,
        users: [
          { email: "test@test.com", firstName: "Test", lastName: "User" },
        ],
      });

      expect(result.userCount).toBe(1);
      expect(result.users[0].email).toBe("test@test.com");
    });

    it("should persist the group in the database", async () => {
      const result = await createCmd.execute({
        name: "Persisted",
        status: "DRAFT",
        organizationId: orgId,
        createdById: userId,
      });

      const found = await prisma.targetGroup.findUnique({
        where: { id: result.id },
      });

      expect(found).toBeDefined();
      expect(found!.name).toBe("Persisted");
    });
  });

  describe("UpdateTargetGroupCommand", () => {
    it("should update group name and status", async () => {
      const created = await createCmd.execute({
        name: "Old Name",
        status: "DRAFT",
        organizationId: orgId,
        createdById: userId,
      });

      const result = await updateCmd.execute({
        id: created.id,
        organizationId: orgId,
        data: { name: "New Name", status: "ACTIVE" },
      });

      expect(result).toBe(true);

      const found = await prisma.targetGroup.findUnique({
        where: { id: created.id },
      });
      expect(found!.name).toBe("New Name");
      expect(found!.status).toBe("ACTIVE");
    });

    it("should return false for non-existent group", async () => {
      const result = await updateCmd.execute({
        id: "non-existent",
        organizationId: orgId,
        data: { name: "New", status: "DRAFT" },
      });

      expect(result).toBe(false);
    });
  });

  describe("DeleteTargetGroupCommand", () => {
    it("should delete a target group", async () => {
      const created = await createCmd.execute({
        name: "To Delete",
        status: "DRAFT",
        organizationId: orgId,
        createdById: userId,
      });

      const result = await deleteCmd.execute({
        id: created.id,
        organizationId: orgId,
      });

      expect(result).toBe(true);

      const found = await prisma.targetGroup.findUnique({
        where: { id: created.id },
      });
      expect(found).toBeNull();
    });

    it("should return false for non-existent group", async () => {
      const result = await deleteCmd.execute({
        id: "non-existent",
        organizationId: orgId,
      });

      expect(result).toBe(false);
    });
  });
});
