import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import type { PrismaClient } from "@prisma/client";
import type {
  UserFactory,
  OrganizationFactory,
  JobFactory,
  FileFactory,
} from "@next-phish/database/src/test-db";
import { SiteImportRepository } from "../../src/site-import/repositories/site-import.repository";
import { getPrisma, getFactories } from "../setup";

describe("SiteImportRepository", () => {
  let prisma: PrismaClient;
  let repo: SiteImportRepository;
  let userFactory: UserFactory;
  let orgFactory: OrganizationFactory;
  let jobFactory: JobFactory;
  let fileFactory: FileFactory;
  let orgId: string;
  let userId: string;

  beforeAll(() => {
    prisma = getPrisma();
    repo = new SiteImportRepository(prisma);
    const factories = getFactories();
    userFactory = factories.user;
    orgFactory = factories.organization;
    jobFactory = factories.job;
    fileFactory = factories.file;
  });

  beforeEach(async () => {
    const user = await userFactory.createOne();
    const org = await orgFactory.createOne();
    userId = user.id;
    orgId = org.id;
  });

  describe("site_import CRUD", () => {
    it("should create a site import record", async () => {
      const job = await jobFactory.createOne({
        organizationId: orgId,
        createdById: userId,
      });

      const siteImport = await repo.create({
        jobId: job.id,
        url: "https://example.com",
        includeAssets: false,
        organizationId: orgId,
        createdById: userId,
      });

      expect(siteImport).toBeDefined();
      expect(siteImport.id).toBeDefined();
      expect(siteImport.jobId).toBe(job.id);
      expect(siteImport.url).toBe("https://example.com");
      expect(siteImport.includeAssets).toBe(false);
      expect(siteImport.status).toBe("PENDING");
    });

    it("should find import by job ID", async () => {
      const job = await jobFactory.createOne({
        organizationId: orgId,
        createdById: userId,
      });
      await repo.create({
        jobId: job.id,
        url: "https://example.com",
        includeAssets: false,
        organizationId: orgId,
        createdById: userId,
      });

      const found = await repo.findByJobId(job.id);
      expect(found).toBeDefined();
      expect(found!.jobId).toBe(job.id);
    });

    it("should return null for non-existent job ID", async () => {
      const found = await repo.findByJobId("non-existent");
      expect(found).toBeNull();
    });

    it("should update import status and html", async () => {
      const job = await jobFactory.createOne({
        organizationId: orgId,
        createdById: userId,
      });
      const siteImport = await repo.create({
        jobId: job.id,
        url: "https://example.com",
        includeAssets: false,
        organizationId: orgId,
        createdById: userId,
      });

      const updated = await repo.update(siteImport.id, {
        status: "COMPLETED",
        html: "<html></html>",
        finalUrl: "https://example.com",
      });

      expect(updated.status).toBe("COMPLETED");
      expect(updated.html).toBe("<html></html>");
      expect(updated.finalUrl).toBe("https://example.com");
    });

    it("should update asset stats", async () => {
      const job = await jobFactory.createOne({
        organizationId: orgId,
        createdById: userId,
      });
      const siteImport = await repo.create({
        jobId: job.id,
        url: "https://example.com",
        includeAssets: true,
        organizationId: orgId,
        createdById: userId,
      });

      const updated = await repo.update(siteImport.id, {
        assetDiscovered: 10,
        assetDownloaded: 8,
        assetFailed: 2,
      });

      expect(updated.assetDiscovered).toBe(10);
      expect(updated.assetDownloaded).toBe(8);
      expect(updated.assetFailed).toBe(2);
    });

    it("should delete a site import", async () => {
      const job = await jobFactory.createOne({
        organizationId: orgId,
        createdById: userId,
      });
      const siteImport = await repo.create({
        jobId: job.id,
        url: "https://example.com",
        includeAssets: false,
        organizationId: orgId,
        createdById: userId,
      });

      await repo.delete(siteImport.id);

      const found = await repo.findById(siteImport.id);
      expect(found).toBeNull();
    });
  });

  describe("site_import_file CRUD", () => {
    it("should create a site import file record", async () => {
      const job = await jobFactory.createOne({
        organizationId: orgId,
        createdById: userId,
      });
      const siteImport = await repo.create({
        jobId: job.id,
        url: "https://example.com",
        includeAssets: true,
        organizationId: orgId,
        createdById: userId,
      });

      const file = await fileFactory.createOne({
        organizationId: orgId,
        uploadedById: userId,
      });

      const sif = await repo.createFile({
        siteImportId: siteImport.id,
        fileId: file.id,
        originalUrl: "https://example.com/styles/main.css",
        resolvedUrl: "https://example.com/styles/main.css",
        localPath: "styles/main.css",
        downloadStatus: "downloaded",
      });

      expect(sif).toBeDefined();
      expect(sif.siteImportId).toBe(siteImport.id);
      expect(sif.fileId).toBe(file.id);
      expect(sif.localPath).toBe("styles/main.css");
    });

    it("should find file by ID", async () => {
      const job = await jobFactory.createOne({
        organizationId: orgId,
        createdById: userId,
      });
      const siteImport = await repo.create({
        jobId: job.id,
        url: "https://example.com",
        includeAssets: true,
        organizationId: orgId,
        createdById: userId,
      });

      const file = await fileFactory.createOne({
        organizationId: orgId,
        uploadedById: userId,
        remoteId: "remote-test",
        format: "application/javascript",
      });

      const sif = await repo.createFile({
        siteImportId: siteImport.id,
        fileId: file.id,
        originalUrl: "https://example.com/scripts/app.js",
        resolvedUrl: "https://example.com/scripts/app.js",
        localPath: "scripts/app.js",
        downloadStatus: "downloaded",
      });

      const found = await repo.findFileById(sif.id);
      expect(found).toBeDefined();
      expect(found!.localPath).toBe("scripts/app.js");
      expect(found!.file.remoteId).toBe("remote-test");
    });

    it("should return null for non-existent file ID", async () => {
      const found = await repo.findFileById("non-existent");
      expect(found).toBeNull();
    });

    it("should cascade delete when site import is deleted", async () => {
      const job = await jobFactory.createOne({
        organizationId: orgId,
        createdById: userId,
      });
      const siteImport = await repo.create({
        jobId: job.id,
        url: "https://example.com",
        includeAssets: true,
        organizationId: orgId,
        createdById: userId,
      });

      const file = await fileFactory.createOne({
        organizationId: orgId,
        uploadedById: userId,
      });

      await repo.createFile({
        siteImportId: siteImport.id,
        fileId: file.id,
        originalUrl: "https://example.com/test.css",
        resolvedUrl: "https://example.com/test.css",
        localPath: "test.css",
        downloadStatus: "downloaded",
      });

      await repo.delete(siteImport.id);

      const files = await repo.findFilesByImportId(siteImport.id);
      expect(files.length).toBe(0);
    });
  });
});
