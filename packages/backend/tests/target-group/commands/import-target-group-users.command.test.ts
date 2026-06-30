import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { JobRepository } from "../../../src/job/repositories/job.repository";
import { TargetGroupRepository } from "../../../src/target-group/repositories/target-group.repository";
import { FileRepository } from "../../../src/file/repositories/file.repository";
import { ImportTargetGroupUsersCommand } from "../../../src/target-group/commands/import-target-group-users.command";
import { getPrisma, getFactories } from "../../setup";

function createXlsxBuffer(rows: Array<Record<string, string>>): Buffer {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const XLSX = require("xlsx") as typeof import("xlsx");
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return Buffer.from(buffer);
}

class MockR2Client {
  private files = new Map<string, Buffer>();

  async uploadObject(key: string, body: Buffer): Promise<void> {
    this.files.set(key, body);
  }

  async getObject(
    key: string,
  ): Promise<{ body: Buffer; contentType: string } | null> {
    const body = this.files.get(key);
    if (!body) return null;
    return { body, contentType: "application/octet-stream" };
  }

  async deleteObject(key: string): Promise<void> {
    this.files.delete(key);
  }

  async getPublicUrl(key: string): Promise<string> {
    return `https://test.example.com/${key}`;
  }
}

describe("ImportTargetGroupUsersCommand", () => {
  let prisma: PrismaClient;
  let jobRepo: JobRepository;
  let targetGroupRepo: TargetGroupRepository;
  let fileRepo: FileRepository;
  let r2: MockR2Client;
  let command: ImportTargetGroupUsersCommand;
  let orgId: string;
  let userId: string;

  beforeAll(() => {
    prisma = getPrisma();
    jobRepo = new JobRepository(prisma);
    targetGroupRepo = new TargetGroupRepository(prisma);
    fileRepo = new FileRepository(prisma);
    r2 = new MockR2Client();
    command = new ImportTargetGroupUsersCommand(
      jobRepo,
      targetGroupRepo,
      fileRepo,
      r2 as never,
    );
  });

  beforeEach(async () => {
    const factories = getFactories();
    const user = await factories.user.createOne();
    const org = await factories.organization.createOne();
    userId = user.id;
    orgId = org.id;
  });

  async function uploadAndCreateJob(
    targetGroupId: string,
    mode: "insert" | "upsert",
    rows: Array<Record<string, string>>,
    fileName = "users.xlsx",
  ) {
    const buffer = createXlsxBuffer(rows);
    const remoteId = `${orgId}/test-${Date.now()}.xlsx`;
    await r2.uploadObject(remoteId, buffer);

    const file = await fileRepo.create({
      remoteId,
      name: fileName,
      size: buffer.length,
      format:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      purpose: "IMPORT",
      organizationId: orgId,
      uploadedById: userId,
    });

    const job = await jobRepo.create({
      type: "target_group_import",
      input: { targetGroupId, mode, fileId: file.id, fileName },
      organizationId: orgId,
      createdById: userId,
    });

    return { job, file };
  }

  describe("insert mode", () => {
    it("should import users from XLSX file", async () => {
      const group = await targetGroupRepo.create({
        name: "Import Test",
        status: "DRAFT",
        organizationId: orgId,
        createdById: userId,
      });

      const { job } = await uploadAndCreateJob(group.id, "insert", [
        { email: "alice@test.com", firstName: "Alice", lastName: "Smith" },
        { email: "bob@test.com", firstName: "Bob", lastName: "Jones" },
      ]);

      await command.execute({ jobId: job.id });

      const updatedJob = await jobRepo.findById(job.id);
      expect(updatedJob!.status).toBe("COMPLETED");

      const progress = updatedJob!.progress as {
        total: number;
        inserted: number;
        updated: number;
        skipped: number;
        errors: number;
      };
      expect(progress.total).toBe(2);
      expect(progress.inserted).toBe(2);
      expect(progress.updated).toBe(0);
      expect(progress.skipped).toBe(0);
      expect(progress.errors).toBe(0);

      const { rows } = await targetGroupRepo.findUsersByGroupId(group.id, {
        limit: 10,
        offset: 0,
      });
      expect(rows).toHaveLength(2);
    });

    it("should skip duplicate emails on insert", async () => {
      const group = await targetGroupRepo.create({
        name: "Dup Test",
        status: "DRAFT",
        organizationId: orgId,
        createdById: userId,
        users: [
          {
            email: "existing@test.com",
            firstName: "Existing",
            lastName: "User",
          },
        ],
      });

      const { job } = await uploadAndCreateJob(group.id, "insert", [
        {
          email: "existing@test.com",
          firstName: "Updated",
          lastName: "Name",
        },
        { email: "new@test.com", firstName: "New", lastName: "User" },
      ]);

      await command.execute({ jobId: job.id });

      const updatedJob = await jobRepo.findById(job.id);
      const progress = updatedJob!.progress as {
        inserted: number;
        updated: number;
        skipped: number;
      };
      expect(progress.inserted).toBe(1);
      expect(progress.updated).toBe(0);
      expect(progress.skipped).toBe(1);
    });
  });

  describe("upsert mode", () => {
    it("should insert new users and update existing ones", async () => {
      const group = await targetGroupRepo.create({
        name: "Upsert Test",
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

      const { job } = await uploadAndCreateJob(group.id, "upsert", [
        {
          email: "existing@test.com",
          firstName: "New",
          lastName: "Name",
          position: "Manager",
        },
        { email: "brand-new@test.com", firstName: "Fresh", lastName: "User" },
      ]);

      await command.execute({ jobId: job.id });

      const updatedJob = await jobRepo.findById(job.id);
      expect(updatedJob!.status).toBe("COMPLETED");

      const progress = updatedJob!.progress as {
        inserted: number;
        updated: number;
        skipped: number;
      };
      expect(progress.inserted).toBe(1);
      expect(progress.updated).toBe(1);
      expect(progress.skipped).toBe(0);

      const { rows } = await targetGroupRepo.findUsersByGroupId(group.id, {
        limit: 10,
        offset: 0,
      });
      expect(rows).toHaveLength(2);

      const updated = rows.find((r) => r.email === "existing@test.com");
      expect(updated!.firstName).toBe("New");
      expect(updated!.position).toBe("Manager");
    });
  });

  describe("validation", () => {
    it("should report validation errors for missing email", async () => {
      const group = await targetGroupRepo.create({
        name: "Validation Test",
        status: "DRAFT",
        organizationId: orgId,
        createdById: userId,
      });

      const { job } = await uploadAndCreateJob(group.id, "insert", [
        { email: "", firstName: "No", lastName: "Email" },
        {
          email: "valid@test.com",
          firstName: "Valid",
          lastName: "User",
        },
      ]);

      await command.execute({ jobId: job.id });

      const updatedJob = await jobRepo.findById(job.id);
      expect(updatedJob!.status).toBe("COMPLETED");

      const progress = updatedJob!.progress as {
        total: number;
        inserted: number;
        errors: number;
        validationErrors: Array<{
          row: number;
          field: string;
          message: string;
        }>;
      };
      expect(progress.total).toBe(1);
      expect(progress.inserted).toBe(1);
      expect(progress.errors).toBe(1);
      expect(progress.validationErrors).toHaveLength(1);
      expect(progress.validationErrors[0].row).toBe(2);
    });

    it("should report validation errors for invalid email format", async () => {
      const group = await targetGroupRepo.create({
        name: "Invalid Email Test",
        status: "DRAFT",
        organizationId: orgId,
        createdById: userId,
      });

      const { job } = await uploadAndCreateJob(group.id, "insert", [
        {
          email: "not-an-email",
          firstName: "Bad",
          lastName: "Email",
        },
      ]);

      await command.execute({ jobId: job.id });

      const updatedJob = await jobRepo.findById(job.id);
      const progress = updatedJob!.progress as {
        validationErrors: Array<{
          row: number;
          field: string;
          message: string;
        }>;
      };
      expect(progress.validationErrors).toHaveLength(1);
      expect(progress.validationErrors[0].field).toBe("email");
    });
  });

  describe("column matching", () => {
    it("should recognize 'Email' (case-insensitive) as email column", async () => {
      const group = await targetGroupRepo.create({
        name: "Case Test",
        status: "DRAFT",
        organizationId: orgId,
        createdById: userId,
      });

      const { job } = await uploadAndCreateJob(group.id, "insert", [
        {
          Email: "case@test.com",
          FirstName: "Case",
          LastName: "Test",
        },
      ]);

      await command.execute({ jobId: job.id });

      const updatedJob = await jobRepo.findById(job.id);
      const progress = updatedJob!.progress as { inserted: number };
      expect(progress.inserted).toBe(1);

      const { rows } = await targetGroupRepo.findUsersByGroupId(group.id, {
        limit: 10,
        offset: 0,
      });
      expect(rows).toHaveLength(1);
      expect(rows[0].email).toBe("case@test.com");
    });

    it("should recognize 'POSITION' (uppercase) as position column", async () => {
      const group = await targetGroupRepo.create({
        name: "Position Test",
        status: "DRAFT",
        organizationId: orgId,
        createdById: userId,
      });

      const { job } = await uploadAndCreateJob(group.id, "insert", [
        {
          email: "pos@test.com",
          firstName: "Pos",
          lastName: "Test",
          POSITION: "Developer",
        },
      ]);

      await command.execute({ jobId: job.id });

      const { rows } = await targetGroupRepo.findUsersByGroupId(group.id, {
        limit: 10,
        offset: 0,
      });
      expect(rows).toHaveLength(1);
      expect(rows[0].position).toBe("Developer");
    });
  });

  describe("job lifecycle", () => {
    it("should set job status to RUNNING then COMPLETED", async () => {
      const group = await targetGroupRepo.create({
        name: "Lifecycle Test",
        status: "DRAFT",
        organizationId: orgId,
        createdById: userId,
      });

      const { job } = await uploadAndCreateJob(group.id, "insert", [
        { email: "test@test.com", firstName: "Test", lastName: "User" },
      ]);

      const beforeRun = await jobRepo.findById(job.id);
      expect(beforeRun!.status).toBe("PENDING");

      await command.execute({ jobId: job.id });

      const afterRun = await jobRepo.findById(job.id);
      expect(afterRun!.status).toBe("COMPLETED");
      expect(afterRun!.startedAt).toBeDefined();
      expect(afterRun!.completedAt).toBeDefined();
    });

    it("should throw for non-existent job", async () => {
      await expect(
        command.execute({ jobId: "non-existent-id" }),
      ).rejects.toThrow("Job not found");
    });
  });

  describe("batch processing", () => {
    it("should update progress during import", async () => {
      const group = await targetGroupRepo.create({
        name: "Progress Test",
        status: "DRAFT",
        organizationId: orgId,
        createdById: userId,
      });

      const rows = Array.from({ length: 10 }, (_, i) => ({
        email: `user${i}@test.com`,
        firstName: `User${i}`,
        lastName: `Last${i}`,
      }));
      const { job } = await uploadAndCreateJob(group.id, "insert", rows);

      await command.execute({ jobId: job.id });

      const updatedJob = await jobRepo.findById(job.id);
      const progress = updatedJob!.progress as {
        total: number;
        processed: number;
        inserted: number;
        totalBatches: number;
        currentBatch: number;
      };
      expect(progress.total).toBe(10);
      expect(progress.processed).toBe(10);
      expect(progress.inserted).toBe(10);
      expect(progress.totalBatches).toBe(1);
      expect(progress.currentBatch).toBe(1);
    });
  });
});
