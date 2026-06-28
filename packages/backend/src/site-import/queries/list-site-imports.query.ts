import { SiteImportRepository } from "../repositories";
import { SiteImportService } from "../services";
import type { SiteImportView } from "../types";
import type { IQueryHandler } from "../../message-bus";

interface ListSiteImportsInput {
  organizationId: string;
  search?: string;
  limit?: number;
}

export class ListSiteImportsQuery implements IQueryHandler<
  ListSiteImportsInput,
  Array<SiteImportView & { fileCount: number }>
> {
  constructor(
    private readonly siteImportRepo: SiteImportRepository,
    private readonly siteImportService: SiteImportService,
  ) {}

  async execute({ organizationId, search, limit }: ListSiteImportsInput) {
    const rows = await this.siteImportRepo.listByOrganization(
      organizationId,
      search,
      limit,
    );
    return rows.map((row) => ({
      ...this.siteImportService.toView(row as SiteImportView),
      fileCount: (row as unknown as { _count: { files: number } })._count.files,
    }));
  }
}
