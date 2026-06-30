import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { JobRepository } from "../../../src/job/repositories/job.repository";
import { TargetGroupRepository } from "../../../src/target-group/repositories/target-group.repository";
import { ImportTargetGroupUsersCommand } from "../../../src/target-group/commands/import-target-group-users.command";
import { getPrisma, getFactories } from "../../setup";

function createXlsxBase64(rows: Array<Record<string, string>>): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const XLSX = require("xlsx") as typeof import("xlsx");
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return Buffer.from(buffer).toString("base64");
}

function createCsvBase64(rows: Array<Record<string, string>>): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const XLSX = require("xlsx") as typeof import("xlsx");
  const ws = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(ws);
  return Buffer.from(csv).toString("base64");
}

describe("ImportTargetGroupUsersCommand", () => {
  let prisma: PrismaClient;
  let jobRepo: JobRepository;
  let targetGroupRepo: TargetGroupRepository;
  let command: ImportTargetGroupUsersCommand;
  let orgId: string;
  let userId: string;

  beforeAll(() => {
    prisma = getPrisma();
    jobRepo = new JobRepository(prisma);
    targetGroupRepo = new TargetGroupRepository(prisma);
    command = new ImportTargetGroupUsersCommand(jobRepo, targetGroupRepo);
  });

  beforeEach(async () => {
    const factories = getFactories();
    const user = await factories.user.createOne();
    const org = await factories.organization.createOne();
    userId = user.id;
    orgId = org.id;
  });

  async function createImportJob(
    targetGroupId: string,
    mode: "insert" | "upsert",
    file: string,
    fileName: string,
  ) {
    const job = await jobRepo.create({
      type: "target_group_import",
      input: { targetGroupId, mode, file, fileName },
      organizationId: orgId,
      createdById: userId,
    });
    return job;
  }

  describe("insert mode", () => {
    it("should import users from XLSX file", async () => {
      const group = await targetGroupRepo.create({
        name: "Import Test",
        status: "DRAFT",
        organizationId: orgId,
        createdById: userId,
      });

      const file = createXlsxBase64([
        { email: "alice@test.com", firstName: "Alice", lastName: "Smith" },
        { email: "bob@test.com", firstName: "Bob", lastName: "Jones" },
      ]);

      const job = await createImportJob(group.id, "insert", file, "users.xlsx");
      await command.execute({ jobId: job.id });

      const updatedJob = await jobRepo.findById(job.id);
      expect(updatedJob!.status).toBe("COMPLETED");

      const progress = updatedJob!.progress as {
        total: number;
        inserted: number;
        updated: number;
        errors: number;
      };
      expect(progress.total).toBe(2);
      expect(progress.inserted).toBe(2);
      expect(progress.updated).toBe(0);
      expect(progress.errors).toBe(0);

      const { rows } = await targetGroupRepo.findUsersByGroupId(group.id, {
        limit: 10,
        offset: 0,
      });
      expect(rows).toHaveLength(2);
      expect(rows.map((r) => r.email).sort()).toEqual([
        "alice@test.com",
        "bob@test.com",
      ]);
    });

    it("should import users from CSV file", async () => {
      const group = await targetGroupRepo.create({
        name: "CSV Import",
        status: "DRAFT",
        organizationId: orgId,
        createdById: userId,
      });

      const file = createCsvBase64([
        { email: "csv@test.com", firstName: "CSV", lastName: "User" },
      ]);

      const job = await createImportJob(group.id, "insert", file, "users.csv");
      await command.execute({ jobId: job.id });

      const updatedJob = await jobRepo.findById(job.id);
      expect(updatedJob!.status).toBe("COMPLETED");

      const { rows } = await targetGroupRepo.findUsersByGroupId(group.id, {
        limit: 10,
        offset: 0,
      });
      expect(rows).toHaveLength(1);
      expect(rows[0].email).toBe("csv@test.com");
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

      const file = createXlsxBase64([
        {
          email: "existing@test.com",
          firstName: "Updated",
          lastName: "Name",
        },
        { email: "new@test.com", firstName: "New", lastName: "User" },
      ]);

      const job = await createImportJob(group.id, "insert", file, "users.xlsx");
      await command.execute({ jobId: job.id });

      const updatedJob = await jobRepo.findById(job.id);
      const progress = updatedJob!.progress as {
        inserted: number;
        updated: number;
      };
      // insert mode skips duplicates, so only 1 new user inserted
      expect(progress.inserted).toBe(1);
      expect(progress.updated).toBe(0);

      const { rows } = await targetGroupRepo.findUsersByGroupId(group.id, {
        limit: 10,
        offset: 0,
      });
      expect(rows).toHaveLength(2);
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

      const file = createXlsxBase64([
        {
          email: "existing@test.com",
          firstName: "New",
          lastName: "Name",
          position: "Manager",
        },
        { email: "brand-new@test.com", firstName: "Fresh", lastName: "User" },
      ]);

      const job = await createImportJob(group.id, "upsert", file, "users.xlsx");
      await command.execute({ jobId: job.id });

      const updatedJob = await jobRepo.findById(job.id);
      expect(updatedJob!.status).toBe("COMPLETED");

      const progress = updatedJob!.progress as {
        inserted: number;
        updated: number;
      };
      expect(progress.inserted).toBe(1);
      expect(progress.updated).toBe(1);

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

      const file = createXlsxBase64([
        { email: "", firstName: "No", lastName: "Email" },
        {
          email: "valid@test.com",
          firstName: "Valid",
          lastName: "User",
        },
      ]);

      const job = await createImportJob(group.id, "insert", file, "users.xlsx");
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
      expect(progress.total).toBe(1); // only valid row
      expect(progress.inserted).toBe(1);
      expect(progress.errors).toBe(1);
      expect(progress.validationErrors).toHaveLength(1);
      expect(progress.validationErrors[0].row).toBe(2);
      expect(progress.validationErrors[0].field).toBe("email");
    });

    it("should report validation errors for invalid email format", async () => {
      const group = await targetGroupRepo.create({
        name: "Invalid Email Test",
        status: "DRAFT",
        organizationId: orgId,
        createdById: userId,
      });

      const file = createXlsxBase64([
        {
          email: "not-an-email",
          firstName: "Bad",
          lastName: "Email",
        },
      ]);

      const job = await createImportJob(group.id, "insert", file, "users.xlsx");
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
      expect(progress.validationErrors[0].message).toBe("Invalid email format");
    });

    it("should report validation errors for missing first name", async () => {
      const group = await targetGroupRepo.create({
        name: "Missing Name Test",
        status: "DRAFT",
        organizationId: orgId,
        createdById: userId,
      });

      const file = createXlsxBase64([
        { email: "test@test.com", firstName: "", lastName: "Doe" },
      ]);

      const job = await createImportJob(group.id, "insert", file, "users.xlsx");
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
      expect(progress.validationErrors[0].field).toBe("firstName");
    });

    it("should report validation errors for missing last name", async () => {
      const group = await targetGroupRepo.create({
        name: "Missing Last Test",
        status: "DRAFT",
        organizationId: orgId,
        createdById: userId,
      });

      const file = createXlsxBase64([
        { email: "test@test.com", firstName: "John", lastName: "" },
      ]);

      const job = await createImportJob(group.id, "insert", file, "users.xlsx");
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
      expect(progress.validationErrors[0].field).toBe("lastName");
    });
  });

  describe("column aliases", () => {
    it("should recognize 'E-mail' as email column", async () => {
      const group = await targetGroupRepo.create({
        name: "Alias Test",
        status: "DRAFT",
        organizationId: orgId,
        createdById: userId,
      });

      const file = createXlsxBase64([
        {
          "E-mail": "alias@test.com",
          "First Name": "Alias",
          "Last Name": "Test",
        },
      ]);

      const job = await createImportJob(group.id, "insert", file, "users.xlsx");
      await command.execute({ jobId: job.id });

      const updatedJob = await jobRepo.findById(job.id);
      const progress = updatedJob!.progress as { inserted: number };
      expect(progress.inserted).toBe(1);

      const { rows } = await targetGroupRepo.findUsersByGroupId(group.id, {
        limit: 10,
        offset: 0,
      });
      expect(rows).toHaveLength(1);
      expect(rows[0].email).toBe("alias@test.com");
    });

    it("should recognize 'Surname' as lastName column", async () => {
      const group = await targetGroupRepo.create({
        name: "Surname Test",
        status: "DRAFT",
        organizationId: orgId,
        createdById: userId,
      });

      const file = createXlsxBase64([
        {
          email: "surname@test.com",
          Name: "Test",
          Surname: "User",
          Title: "Developer",
        },
      ]);

      const job = await createImportJob(group.id, "insert", file, "users.xlsx");
      await command.execute({ jobId: job.id });

      const { rows } = await targetGroupRepo.findUsersByGroupId(group.id, {
        limit: 10,
        offset: 0,
      });
      expect(rows).toHaveLength(1);
      expect(rows[0].lastName).toBe("User");
      expect(rows[0].position).toBe("Developer");
    });
  });

  describe("empty file", () => {
    it("should complete with zero rows for empty file", async () => {
      const group = await targetGroupRepo.create({
        name: "Empty Test",
        status: "DRAFT",
        organizationId: orgId,
        createdById: userId,
      });

      const file = createXlsxBase64([]);

      const job = await createImportJob(group.id, "insert", file, "empty.xlsx");
      await command.execute({ jobId: job.id });

      const updatedJob = await jobRepo.findById(job.id);
      expect(updatedJob!.status).toBe("COMPLETED");
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

      const file = createXlsxBase64([
        { email: "test@test.com", firstName: "Test", lastName: "User" },
      ]);

      const job = await createImportJob(group.id, "insert", file, "users.xlsx");

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
      const file = createXlsxBase64(rows);

      const job = await createImportJob(group.id, "insert", file, "users.xlsx");
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

    it("should handle multiple batches", async () => {
      const group = await targetGroupRepo.create({
        name: "Batch Test",
        status: "DRAFT",
        organizationId: orgId,
        createdById: userId,
      });

      // Create 600 rows to trigger 2 batches (BATCH_SIZE = 500)
      const rows = Array.from({ length: 600 }, (_, i) => ({
        email: `batch${i}@test.com`,
        firstName: `Batch${i}`,
        lastName: `User${i}`,
      }));
      const file = createXlsxBase64(rows);

      const job = await createImportJob(group.id, "insert", file, "users.xlsx");
      await command.execute({ jobId: job.id });

      const updatedJob = await jobRepo.findById(job.id);
      const progress = updatedJob!.progress as {
        total: number;
        inserted: number;
        totalBatches: number;
      };
      expect(progress.total).toBe(600);
      expect(progress.inserted).toBe(600);
      expect(progress.totalBatches).toBe(2);

      const { total } = await targetGroupRepo.findUsersByGroupId(group.id, {
        limit: 1,
        offset: 0,
      });
      expect(total).toBe(600);
    });
  });
});
