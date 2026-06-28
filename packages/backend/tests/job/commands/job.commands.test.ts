import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { JobRepository } from "../../../src/job/repositories/job.repository";
import { CreateJobCommand } from "../../../src/job/commands/create-job.command";
import { UpdateJobCommand } from "../../../src/job/commands/update-job.command";
import { getPrisma, getFactories } from "../../setup";

describe("JobCommands", () => {
  let prisma: PrismaClient;
  let jobRepo: JobRepository;
  let createJob: CreateJobCommand;
  let updateJob: UpdateJobCommand;
  let orgId: string;
  let userId: string;

  beforeAll(() => {
    prisma = getPrisma();
    jobRepo = new JobRepository(prisma);
    createJob = new CreateJobCommand(jobRepo);
    updateJob = new UpdateJobCommand(jobRepo);
  });

  beforeEach(async () => {
    const factories = getFactories();
    const user = await factories.user.createOne();
    const org = await factories.organization.createOne();
    userId = user.id;
    orgId = org.id;
  });

  describe("CreateJobCommand", () => {
    it("should create a job and return the result", async () => {
      const result = await createJob.execute({
        type: "site_import",
        input: { url: "https://example.com" },
        organizationId: orgId,
        createdById: userId,
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.type).toBe("site_import");
      expect(result.status).toBe("PENDING");
      expect(result.organizationId).toBe(orgId);
      expect(result.createdById).toBe(userId);
    });

    it("should persist the job in the database", async () => {
      const result = await createJob.execute({
        type: "site_import",
        input: { url: "https://example.com", includeAssets: true },
        organizationId: orgId,
        createdById: userId,
      });

      const found = await prisma.job.findUnique({
        where: { id: result.id },
      });

      expect(found).toBeDefined();
      expect(found!.type).toBe("site_import");
      expect(found!.input).toEqual({
        url: "https://example.com",
        includeAssets: true,
      });
    });
  });

  describe("UpdateJobCommand", () => {
    it("should update job status to RUNNING", async () => {
      const job = await createJob.execute({
        type: "site_import",
        input: {},
        organizationId: orgId,
        createdById: userId,
      });

      const updated = await updateJob.execute({
        id: job.id,
        data: { status: "RUNNING", startedAt: new Date() },
      });

      expect(updated.status).toBe("RUNNING");
      expect(updated.startedAt).toBeDefined();
    });

    it("should update job to COMPLETED with output", async () => {
      const job = await createJob.execute({
        type: "site_import",
        input: {},
        organizationId: orgId,
        createdById: userId,
      });

      const output = { html: "<html></html>", stats: { discovered: 5 } };
      const updated = await updateJob.execute({
        id: job.id,
        data: { status: "COMPLETED", output, completedAt: new Date() },
      });

      expect(updated.status).toBe("COMPLETED");
      expect(updated.output).toEqual(output);
      expect(updated.completedAt).toBeDefined();
    });

    it("should update job to FAILED with error output", async () => {
      const job = await createJob.execute({
        type: "site_import",
        input: {},
        organizationId: orgId,
        createdById: userId,
      });

      const output = { error: "Fetch failed" };
      const updated = await updateJob.execute({
        id: job.id,
        data: { status: "FAILED", output, completedAt: new Date() },
      });

      expect(updated.status).toBe("FAILED");
      expect(updated.output).toEqual(output);
    });
  });
});
