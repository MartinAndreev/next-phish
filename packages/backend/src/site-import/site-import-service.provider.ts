import { Container } from "typedi";
import type { PrismaClient } from "@prisma/client";
import { SiteImportRepository } from "./repositories";
import { SiteImportService } from "./services";
import { ImportChainService } from "./services/import-chain.service";
import {
  FetchHtmlHandler,
  ParseAndNormalizeHandler,
  DiscoverAssetsHandler,
  DownloadAssetsHandler,
  RewriteReferencesHandler,
  FinalizeHandler,
} from "./handlers";
import { CreateSiteImportCommand, ProcessSiteImportCommand } from "./commands";
import { GetSiteImportByJobIdQuery, ListSiteImportsQuery } from "./queries";
import { JobRepository } from "../job/repositories";

export function registerSiteImportServices(db: PrismaClient): void {
  const siteImportRepo = new SiteImportRepository(db);
  const siteImportService = new SiteImportService();
  const jobRepo = Container.get(JobRepository);

  const fetchHtml = new FetchHtmlHandler();
  const parseHtml = new ParseAndNormalizeHandler();
  const discoverAssets = new DiscoverAssetsHandler();
  const downloadAssets = new DownloadAssetsHandler();
  const rewriteReferences = new RewriteReferencesHandler();
  const finalize = new FinalizeHandler();

  const chainService = new ImportChainService(
    fetchHtml,
    parseHtml,
    discoverAssets,
    downloadAssets,
    rewriteReferences,
    finalize,
  );

  Container.set(SiteImportRepository, siteImportRepo);
  Container.set(SiteImportService, siteImportService);
  Container.set(ImportChainService, chainService);
  Container.set(
    CreateSiteImportCommand,
    new CreateSiteImportCommand(jobRepo, siteImportRepo),
  );
  Container.set(
    ProcessSiteImportCommand,
    new ProcessSiteImportCommand(
      jobRepo,
      siteImportRepo,
      siteImportService,
      chainService,
    ),
  );
  Container.set(
    GetSiteImportByJobIdQuery,
    new GetSiteImportByJobIdQuery(siteImportRepo, siteImportService),
  );
  Container.set(
    ListSiteImportsQuery,
    new ListSiteImportsQuery(siteImportRepo, siteImportService),
  );
}
