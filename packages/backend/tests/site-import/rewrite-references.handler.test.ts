import { describe, it, expect } from "vitest";
import * as cheerio from "cheerio";
import { RewriteReferencesHandler } from "../../src/site-import/handlers/rewrite-references.handler";
import type {
  ImportContext,
  DownloadedAsset,
} from "../../src/site-import/types";
import { simplePageHtml } from "../data/fixtures";

describe("RewriteReferencesHandler", () => {
  const handler = new RewriteReferencesHandler();

  function createContext(
    html: string,
    downloadedAssets: DownloadedAsset[],
  ): ImportContext {
    const $ = cheerio.load(html);
    return {
      siteImportId: "import-123",
      organizationId: "org-1",
      createdById: "user-1",
      url: "https://example.com",
      html,
      $,
      assetCandidates: [],
      downloadedAssets,
      rewrittenHtml: undefined,
      stats: { discovered: 0, downloaded: 0, failed: 0, skipped: 0 },
      warnings: [],
      includeAssets: true,
    };
  }

  function makeAsset(
    originalUrl: string,
    localPath: string,
    siteImportFileId = "sif-1",
    attribute = "src",
  ): DownloadedAsset {
    return {
      candidate: {
        originalUrl,
        resolvedUrl: originalUrl,
        attribute,
        elementIndex: 0,
      },
      siteImportFileId,
      remoteId: "remote-1",
      localPath,
      contentHash: "",
      size: 100,
      contentType: "image/png",
    };
  }

  it("should rewrite img src attributes", async () => {
    const assets = [
      makeAsset("/images/logo.png", "images/logo.png", "sif-logo"),
    ];
    const ctx = createContext(simplePageHtml, assets);
    const next = async () => {};

    await handler.handle(ctx, next);

    const imgSrc = ctx.$('img[src*="/api/imports/"]').attr("src");
    expect(imgSrc).toBe("/api/imports/import-123/assets/sif-logo/logo.png");
  });

  it("should rewrite link href attributes", async () => {
    const assets = [
      makeAsset("/styles/main.css", "styles/main.css", "sif-css", "href"),
    ];
    const ctx = createContext(simplePageHtml, assets);
    const next = async () => {};

    await handler.handle(ctx, next);

    const linkHref = ctx.$('link[href*="/api/imports/"]').attr("href");
    expect(linkHref).toBe("/api/imports/import-123/assets/sif-css/main.css");
  });

  it("should rewrite script src attributes", async () => {
    const assets = [
      makeAsset("/scripts/app.js", "scripts/app.js", "sif-js", "src"),
    ];
    const ctx = createContext(simplePageHtml, assets);
    const next = async () => {};

    await handler.handle(ctx, next);

    const scriptSrc = ctx.$('script[src*="/api/imports/"]').attr("src");
    expect(scriptSrc).toBe("/api/imports/import-123/assets/sif-js/app.js");
  });

  it("should set rewrittenHtml", async () => {
    const ctx = createContext(simplePageHtml, []);
    const next = async () => {};

    await handler.handle(ctx, next);

    expect(ctx.rewrittenHtml).toBeDefined();
    expect(ctx.rewrittenHtml).toContain("<html>");
  });

  it("should not rewrite URLs that were not downloaded", async () => {
    const ctx = createContext(simplePageHtml, []);
    const next = async () => {};

    await handler.handle(ctx, next);

    const imgSrc = ctx.$("img").first().attr("src");
    expect(imgSrc).toBe("/images/logo.png");
  });

  it("should remove the base tag after rewriting", async () => {
    const htmlWithBase = `<html><head><base href="https://example.com"></head><body><img src="/images/logo.png"></body></html>`;
    const assets = [
      makeAsset("/images/logo.png", "images/logo.png", "sif-logo"),
    ];
    const ctx = createContext(htmlWithBase, assets);
    const next = async () => {};

    await handler.handle(ctx, next);

    expect(ctx.$("base").length).toBe(0);
    expect(ctx.rewrittenHtml).not.toContain("<base");
  });

  it("should call next()", async () => {
    const ctx = createContext(simplePageHtml, []);
    let nextCalled = false;
    const next = async () => {
      nextCalled = true;
    };

    await handler.handle(ctx, next);
    expect(nextCalled).toBe(true);
  });
});
