import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import type { PrismaClient } from "@prisma/client";
import type {
  UserFactory,
  OrganizationFactory,
} from "@next-phish/database/src/test-db";
import { JobRepository } from "../../src/job/repositories/job.repository";
import { getPrisma, getFactories } from "../setup";

describe("JobRepository", () => {
  let prisma: PrismaClient;
  let jobRepo: JobRepository;
  let userFactory: UserFactory;
  let orgFactory: OrganizationFactory;
  let orgId: string;
  let userId: string;

  beforeAll(() => {
    prisma = getPrisma();
    jobRepo = new JobRepository(prisma);
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
    it("should create a job with PENDING status", async () => {
      const job = await jobRepo.create({
        type: "site_import",
        input: { url: "https://example.com", includeAssets: false },
        organizationId: orgId,
        createdById: userId,
      });

      expect(job).toBeDefined();
      expect(job.id).toBeDefined();
      expect(job.type).toBe("site_import");
      expect(job.status).toBe("PENDING");
      expect(job.organizationId).toBe(orgId);
      expect(job.createdById).toBe(userId);
    });

    it("should store input as JSON", async () => {
      const input = { url: "https://example.com", includeAssets: true };
      const job = await jobRepo.create({
        type: "site_import",
        input,
        organizationId: orgId,
        createdById: userId,
      });

      expect(job.input).toEqual(input);
    });
  });

  describe("findById", () => {
    it("should find an existing job", async () => {
      const created = await jobRepo.create({
        type: "site_import",
        input: { url: "https://example.com" },
        organizationId: orgId,
        createdById: userId,
      });

      const found = await jobRepo.findById(created.id);
      expect(found).toBeDefined();
      expect(found!.id).toBe(created.id);
    });

    it("should return null for non-existent job", async () => {
      const found = await jobRepo.findById("non-existent-id");
      expect(found).toBeNull();
    });
  });

  describe("update", () => {
    it("should update job status", async () => {
      const job = await jobRepo.create({
        type: "site_import",
        input: { url: "https://example.com" },
        organizationId: orgId,
        createdById: userId,
      });

      const updated = await jobRepo.update(job.id, {
        status: "RUNNING",
        startedAt: new Date(),
      });

      expect(updated.status).toBe("RUNNING");
      expect(updated.startedAt).toBeDefined();
    });

    it("should update job output on completion", async () => {
      const job = await jobRepo.create({
        type: "site_import",
        input: { url: "https://example.com" },
        organizationId: orgId,
        createdById: userId,
      });

      const output = { html: "<html></html>", stats: { discovered: 5 } };
      const updated = await jobRepo.update(job.id, {
        status: "COMPLETED",
        output,
        completedAt: new Date(),
      });

      expect(updated.status).toBe("COMPLETED");
      expect(updated.output).toEqual(output);
      expect(updated.completedAt).toBeDefined();
    });

    it("should list jobs by organization", async () => {
      await jobRepo.create({
        type: "site_import",
        input: {},
        organizationId: orgId,
        createdById: userId,
      });
      await jobRepo.create({
        type: "email_send",
        input: {},
        organizationId: orgId,
        createdById: userId,
      });

      const result = await prisma.job.findMany({
        where: { organizationId: orgId },
      });

      expect(result.length).toBe(2);
    });

    it("should delete a job", async () => {
      const job = await jobRepo.create({
        type: "site_import",
        input: {},
        organizationId: orgId,
        createdById: userId,
      });

      await prisma.job.delete({ where: { id: job.id } });

      const found = await jobRepo.findById(job.id);
      expect(found).toBeNull();
    });
  });
});
