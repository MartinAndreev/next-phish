import { Container } from "typedi";
import { SiteImportRepository } from "../repositories";
import { JobRepository } from "../../job/repositories";
import type { ImportContext, ImportHandler } from "../types";

export class FinalizeHandler implements ImportHandler {
  async handle(ctx: ImportContext, next: () => Promise<void>): Promise<void> {
    const siteImportRepo = Container.get(SiteImportRepository);
    const jobRepo = Container.get(JobRepository);

    const html = ctx.rewrittenHtml || ctx.html || "";
    const hasFailures = ctx.stats.failed > 0;
    const status = hasFailures ? "PARTIAL" : "COMPLETED";

    const siteImport = await siteImportRepo.findById(ctx.siteImportId);

    await siteImportRepo.update(ctx.siteImportId, {
      finalUrl: ctx.finalUrl,
      status: ctx.includeAssets ? status : "COMPLETED",
      html,
    });

    if (siteImport) {
      await jobRepo.update(siteImport.jobId, {
        status: "COMPLETED",
        output: {
          siteImportId: ctx.siteImportId,
          html,
          finalUrl: ctx.finalUrl,
          stats: ctx.stats,
          warnings: ctx.warnings,
        },
        completedAt: new Date(),
      });
    }

    await next();
  }
}
