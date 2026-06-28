import type { ImportContext, ImportHandler } from "../types";

export class FetchHtmlHandler implements ImportHandler {
  async handle(ctx: ImportContext, next: () => Promise<void>): Promise<void> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(ctx.url, {
        signal: controller.signal,
        redirect: "follow",
        headers: {
          "User-Agent": "NextPhish-Importer/1.0",
          Accept: "text/html,application/xhtml+xml,*/*",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch URL: ${response.status} ${response.statusText}`,
        );
      }

      const contentType = response.headers.get("content-type") || "";
      if (
        !contentType.includes("text/html") &&
        !contentType.includes("application/xhtml")
      ) {
        throw new Error(
          `URL did not return HTML content (got: ${contentType})`,
        );
      }

      ctx.html = await response.text();
      ctx.finalUrl = response.url || ctx.url;

      await next();
    } finally {
      clearTimeout(timeout);
    }
  }
}
