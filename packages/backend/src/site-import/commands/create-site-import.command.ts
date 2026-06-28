import { JobRepository } from "../../job/repositories";
import { SiteImportRepository } from "../repositories";
import type { ICommandHandler } from "../../message-bus";

interface CreateSiteImportData {
  url: string;
  includeAssets: boolean;
  organizationId: string;
  createdById: string;
}

interface CreateSiteImportResult {
  jobId: string;
  siteImportId: string;
}

export class CreateSiteImportCommand implements ICommandHandler<
  CreateSiteImportData,
  CreateSiteImportResult
> {
  constructor(
    private readonly jobRepo: JobRepository,
    private readonly siteImportRepo: SiteImportRepository,
  ) {}

  async execute(data: CreateSiteImportData): Promise<CreateSiteImportResult> {
    const job = await this.jobRepo.create({
      type: "site_import",
      input: { url: data.url, includeAssets: data.includeAssets },
      organizationId: data.organizationId,
      createdById: data.createdById,
    });

    const siteImport = await this.siteImportRepo.create({
      jobId: job.id,
      url: data.url,
      includeAssets: data.includeAssets,
      organizationId: data.organizationId,
      createdById: data.createdById,
    });

    return {
      jobId: job.id,
      siteImportId: siteImport.id,
    };
  }
}
