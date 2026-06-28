import type { ImportContext, ImportHandler } from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CheerioElement = any;

function rewriteAttribute(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  $: any,
  selector: string,
  attribute: string,
  urlMap: Map<string, string>,
) {
  $(selector).each((_: number, el: CheerioElement) => {
    const current = $(el).attr(attribute);
    if (current && urlMap.has(current)) {
      $(el).attr(attribute, urlMap.get(current));
    }
  });
}

export class RewriteReferencesHandler implements ImportHandler {
  async handle(ctx: ImportContext, next: () => Promise<void>): Promise<void> {
    const urlMap = new Map<string, string>();

    for (const asset of ctx.downloadedAssets) {
      const fileName = asset.localPath.split("/").pop() || "file";
      const localUrl = `/api/imports/${ctx.siteImportId}/assets/${asset.siteImportFileId}/${encodeURIComponent(fileName)}`;
      urlMap.set(asset.candidate.originalUrl, localUrl);
      urlMap.set(asset.candidate.resolvedUrl, localUrl);
    }

    rewriteAttribute(ctx.$, "[src]", "src", urlMap);
    rewriteAttribute(ctx.$, "[href]", "href", urlMap);
    rewriteAttribute(ctx.$, "[poster]", "poster", urlMap);
    rewriteAttribute(ctx.$, "[data]", "data", urlMap);

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
