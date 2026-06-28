import type { ImportContext, ImportHandler } from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CheerioElement = any;

export class RewriteReferencesHandler implements ImportHandler {
  async handle(ctx: ImportContext, next: () => Promise<void>): Promise<void> {
    const urlMap = new Map<string, string>();

    for (const asset of ctx.downloadedAssets) {
      const localUrl = `/api/imports/${ctx.siteImportId}/assets/${asset.siteImportFileId}/${encodeURIComponent(asset.localPath.split("/").pop() || "file")}`;
      urlMap.set(asset.candidate.originalUrl, localUrl);
      urlMap.set(asset.candidate.resolvedUrl, localUrl);
    }

    ctx.$("[src]").each((_: number, el: CheerioElement) => {
      const current = ctx.$(el).attr("src");
      if (current && urlMap.has(current)) {
        ctx.$(el).attr("src", urlMap.get(current));
      }
    });

    ctx.$("[href]").each((_: number, el: CheerioElement) => {
      const current = ctx.$(el).attr("href");
      if (current && urlMap.has(current)) {
        ctx.$(el).attr("href", urlMap.get(current));
      }
    });

    ctx.$("[poster]").each((_: number, el: CheerioElement) => {
      const current = ctx.$(el).attr("poster");
      if (current && urlMap.has(current)) {
        ctx.$(el).attr("poster", urlMap.get(current));
      }
    });

    ctx.$("[data]").each((_: number, el: CheerioElement) => {
      const current = ctx.$(el).attr("data");
      if (current && urlMap.has(current)) {
        ctx.$(el).attr("data", urlMap.get(current));
      }
    });

    ctx.$("[srcset]").each((_: number, el: CheerioElement) => {
      const current = ctx.$(el).attr("srcset");
      if (!current) return;

      const rewritten = current
        .split(",")
        .map((entry: string) => {
          const parts = entry.trim().split(/\s+/);
          const url = parts[0];
          if (url && urlMap.has(url)) {
            parts[0] = urlMap.get(url)!;
          }
          return parts.join(" ");
        })
        .join(", ");

      ctx.$(el).attr("srcset", rewritten);
    });

    ctx.$("style").each((_: number, el: CheerioElement) => {
      let css = ctx.$(el).html() || "";
      for (const [original, local] of urlMap) {
        css = css.replaceAll(original, local);
      }
      ctx.$(el).html(css);
    });

    ctx.$("[style]").each((_: number, el: CheerioElement) => {
      let style = ctx.$(el).attr("style") || "";
      for (const [original, local] of urlMap) {
        style = style.replaceAll(original, local);
      }
      ctx.$(el).attr("style", style);
    });

    ctx.$("base").remove();

    ctx.rewrittenHtml = ctx.$.html();

    await next();
  }
}
