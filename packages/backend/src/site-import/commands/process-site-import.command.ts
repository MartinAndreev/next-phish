import { JobRepository } from "../../job/repositories";
import { SiteImportRepository } from "../repositories";
import { SiteImportService } from "../services";
import { ImportChainService } from "../services/import-chain.service";
import type { ImportContext } from "../types";
import type { ICommandHandler } from "../../message-bus";

interface ProcessSiteImportData {
  jobId: string;
}

export class ProcessSiteImportCommand implements ICommandHandler<
  ProcessSiteImportData,
  void
> {
  constructor(
    private readonly jobRepo: JobRepository,
    private readonly siteImportRepo: SiteImportRepository,
    private readonly siteImportService: SiteImportService,
    private readonly chainService: ImportChainService,
  ) {}

  async execute(data: ProcessSiteImportData): Promise<void> {
    const job = await this.jobRepo.findById(data.jobId);
    if (!job) throw new Error(`Job not found: ${data.jobId}`);

    const siteImport = await this.siteImportRepo.findByJobId(data.jobId);
    if (!siteImport)
      throw new Error(`SiteImport not found for job: ${data.jobId}`);

    await this.jobRepo.update(data.jobId, {
      status: "RUNNING",
      startedAt: new Date(),
    });

    await this.siteImportRepo.update(siteImport.id, {
      status: "RUNNING",
    });

    const jobInput = job.input as { url: string; includeAssets: boolean };

    const ctx: ImportContext = {
      siteImportId: siteImport.id,
      organizationId: siteImport.organizationId,
      createdById: siteImport.createdById,
      url: jobInput.url,
      includeAssets: jobInput.includeAssets,
      $: null,
      assetCandidates: [],
      downloadedAssets: [],
      stats: { discovered: 0, downloaded: 0, failed: 0, skipped: 0 },
      warnings: [],
    };

    try {
      await this.chainService.run(ctx);
    } catch (error) {
      await this.siteImportRepo.update(siteImport.id, {
        status: "FAILED",
      });
      await this.jobRepo.update(data.jobId, {
        status: "FAILED",
        output: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
        completedAt: new Date(),
      });
      throw error;
    }
  }
}
