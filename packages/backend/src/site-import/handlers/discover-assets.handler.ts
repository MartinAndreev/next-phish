import type { ImportContext, ImportHandler, AssetCandidate } from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CheerioElement = any;

const ASSET_SELECTORS = [
  { selector: "img[src]", attribute: "src" },
  { selector: "img[srcset]", attribute: "srcset" },
  { selector: "script[src]", attribute: "src" },
  { selector: 'link[rel="stylesheet"][href]', attribute: "href" },
  { selector: 'link[rel="icon"][href]', attribute: "href" },
  { selector: 'link[rel="shortcut icon"][href]', attribute: "href" },
  { selector: 'link[rel="apple-touch-icon"][href]', attribute: "href" },
  { selector: "source[src]", attribute: "src" },
  { selector: "source[srcset]", attribute: "srcset" },
  { selector: "video[poster]", attribute: "poster" },
  { selector: "audio[src]", attribute: "src" },
  { selector: "video[src]", attribute: "src" },
  { selector: "embed[src]", attribute: "src" },
  { selector: "object[data]", attribute: "data" },
];

const SKIP_PROTOCOLS = ["data:", "javascript:", "mailto:", "tel:", "#"];

function shouldSkipUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return true;
  return SKIP_PROTOCOLS.some((p) => trimmed.startsWith(p));
}

function resolveUrl(base: string, relative: string): string | null {
  try {
    return new URL(relative, base).href;
  } catch {
    return null;
  }
}

function extractUrlsFromSrcset(srcset: string, baseUrl: string): string[] {
  return srcset
    .split(",")
    .map((entry) => entry.trim().split(/\s+/)[0])
    .filter((url): url is string => Boolean(url) && !shouldSkipUrl(url))
    .map((url) => resolveUrl(baseUrl, url))
    .filter((url): url is string => Boolean(url));
}

function extractUrlsFromCss(css: string, baseUrl: string): string[] {
  const urls: string[] = [];

  const urlPattern = /url\(\s*['"]?([^'")\s]+)['"]?\s*\)/g;
  let match;
  while ((match = urlPattern.exec(css)) !== null) {
    const url = match[1];
    if (!shouldSkipUrl(url)) {
      const resolved = resolveUrl(baseUrl, url);
      if (resolved) urls.push(resolved);
    }
  }

  const importPattern = /@import\s+['"]([^'"]+)['"]/g;
  while ((match = importPattern.exec(css)) !== null) {
    if (!shouldSkipUrl(match[1])) {
      const resolved = resolveUrl(baseUrl, match[1]);
      if (resolved) urls.push(resolved);
    }
  }

  return urls;
}

export class DiscoverAssetsHandler implements ImportHandler {
  async handle(ctx: ImportContext, next: () => Promise<void>): Promise<void> {
    const baseUrl = ctx.finalUrl || ctx.url;
    const candidates: AssetCandidate[] = [];
    const seen = new Set<string>();

    const addCandidate = (
      originalUrl: string,
      resolvedUrl: string,
      attribute: string,
      elementIndex: number,
    ) => {
      if (!seen.has(resolvedUrl)) {
        seen.add(resolvedUrl);
        candidates.push({ originalUrl, resolvedUrl, attribute, elementIndex });
      }
    };

    for (const { selector, attribute } of ASSET_SELECTORS) {
      ctx.$(selector).each((i: number, el: CheerioElement) => {
        const value = ctx.$(el).attr(attribute);
        if (!value || shouldSkipUrl(value)) return;

        if (attribute === "srcset") {
          const urls = extractUrlsFromSrcset(value, baseUrl);
          urls.forEach((url) => addCandidate(url, url, "srcset", i));
        } else {
          const resolved = resolveUrl(baseUrl, value);
          if (resolved) {
            addCandidate(value, resolved, attribute, i);
          }
        }
      });
    }

    ctx.$("style").each((i: number, el: CheerioElement) => {
      const css = ctx.$(el).html() || "";
      const urls = extractUrlsFromCss(css, baseUrl);
      urls.forEach((url) => addCandidate(url, url, "inline-css", i));
    });

    ctx.$("[style]").each((i: number, el: CheerioElement) => {
      const style = ctx.$(el).attr("style") || "";
      const urls = extractUrlsFromCss(style, baseUrl);
      urls.forEach((url) => addCandidate(url, url, "inline-style", i));
    });

    ctx.assetCandidates = candidates;
    ctx.stats.discovered = candidates.length;

    await next();
  }
}
