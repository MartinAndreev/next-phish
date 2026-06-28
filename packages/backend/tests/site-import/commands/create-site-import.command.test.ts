import { describe, it, expect, beforeEach } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { JobRepository } from "../../../src/job/repositories/job.repository";
import { SiteImportRepository } from "../../../src/site-import/repositories/site-import.repository";
import { CreateSiteImportCommand } from "../../../src/site-import/commands/create-site-import.command";
import { getPrisma, getFactories } from "../../setup";

describe("CreateSiteImportCommand", () => {
  let prisma: PrismaClient;
  let jobRepo: JobRepository;
  let siteImportRepo: SiteImportRepository;
  let command: CreateSiteImportCommand;
  let orgId: string;
  let userId: string;

  beforeEach(async () => {
    prisma = getPrisma();
    jobRepo = new JobRepository(prisma);
    siteImportRepo = new SiteImportRepository(prisma);
    command = new CreateSiteImportCommand(jobRepo, siteImportRepo);

    const factories = getFactories();
    const user = await factories.user.createOne();
    const org = await factories.organization.createOne();
    userId = user.id;
    orgId = org.id;
  });

  it("should create both a job and a site import", async () => {
    const result = await command.execute({
      url: "https://example.com",
      includeAssets: false,
      organizationId: orgId,
      createdById: userId,
    });

    expect(result.jobId).toBeDefined();
    expect(result.siteImportId).toBeDefined();
  });

  it("should create a PENDING job with correct input", async () => {
    const result = await command.execute({
      url: "https://example.com",
      includeAssets: true,
      organizationId: orgId,
      createdById: userId,
    });

    const job = await prisma.job.findUnique({
      where: { id: result.jobId },
    });

    expect(job).toBeDefined();
    expect(job!.type).toBe("site_import");
    expect(job!.status).toBe("PENDING");
    expect(job!.input).toEqual({
      url: "https://example.com",
      includeAssets: true,
    });
  });

  it("should create a PENDING site import linked to the job", async () => {
    const result = await command.execute({
      url: "https://example.com/page",
      includeAssets: false,
      organizationId: orgId,
      createdById: userId,
    });

    const siteImport = await prisma.siteImport.findUnique({
      where: { id: result.siteImportId },
    });

    expect(siteImport).toBeDefined();
    expect(siteImport!.jobId).toBe(result.jobId);
    expect(siteImport!.url).toBe("https://example.com/page");
    expect(siteImport!.includeAssets).toBe(false);
    expect(siteImport!.status).toBe("PENDING");
  });

  it("should set organization and user IDs correctly", async () => {
    const result = await command.execute({
      url: "https://example.com",
      includeAssets: false,
      organizationId: orgId,
      createdById: userId,
    });

    const siteImport = await prisma.siteImport.findUnique({
      where: { id: result.siteImportId },
    });

    expect(siteImport!.organizationId).toBe(orgId);
    expect(siteImport!.createdById).toBe(userId);
  });
});
