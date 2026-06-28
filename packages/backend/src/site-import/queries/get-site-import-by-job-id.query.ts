import { SiteImportRepository } from "../repositories";
import { SiteImportService } from "../services";
import type { SiteImportView } from "../types";
import type { IQueryHandler } from "../../message-bus";

interface GetSiteImportByJobIdInput {
  jobId: string;
}

export class GetSiteImportByJobIdQuery implements IQueryHandler<
  GetSiteImportByJobIdInput,
  SiteImportView | null
> {
  constructor(
    private readonly siteImportRepo: SiteImportRepository,
    private readonly siteImportService: SiteImportService,
  ) {}

  async execute({
    jobId,
  }: GetSiteImportByJobIdInput): Promise<SiteImportView | null> {
    const row = await this.siteImportRepo.findByJobId(jobId);
    if (!row) return null;
    return this.siteImportService.toView(row as SiteImportView);
  }
}
