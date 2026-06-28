import { describe, it, expect } from "vitest";
import * as cheerio from "cheerio";
import { DiscoverAssetsHandler } from "../../src/site-import/handlers/discover-assets.handler";
import type { ImportContext } from "../../src/site-import/types";
import {
  simplePageHtml,
  complexPageHtml,
  noAssetsPageHtml,
} from "../data/fixtures";

describe("DiscoverAssetsHandler", () => {
  const handler = new DiscoverAssetsHandler();

  function createContext(
    html: string,
    url = "https://example.com",
  ): ImportContext {
    const $ = cheerio.load(html);
    return {
      siteImportId: "test-import",
      organizationId: "test-org",
      createdById: "test-user",
      url,
      html,
      $,
      assetCandidates: [],
      downloadedAssets: [],
      stats: { discovered: 0, downloaded: 0, failed: 0, skipped: 0 },
      warnings: [],
      includeAssets: true,
    };
  }

  it("should discover image sources", async () => {
    const ctx = createContext(simplePageHtml);
    const next = async () => {};

    await handler.handle(ctx, next);

    const imgAssets = ctx.assetCandidates.filter(
      (c) => c.attribute === "src" && c.resolvedUrl.includes("/images/"),
    );
    expect(imgAssets.length).toBeGreaterThan(0);
  });

  it("should discover script sources", async () => {
    const ctx = createContext(simplePageHtml);
    const next = async () => {};

    await handler.handle(ctx, next);

    const scriptAssets = ctx.assetCandidates.filter((c) =>
      c.resolvedUrl.includes("/scripts/"),
    );
    expect(scriptAssets.length).toBe(1);
    expect(scriptAssets[0].resolvedUrl).toBe(
      "https://example.com/scripts/app.js",
    );
  });

  it("should discover stylesheet links", async () => {
    const ctx = createContext(simplePageHtml);
    const next = async () => {};

    await handler.handle(ctx, next);

    const cssAssets = ctx.assetCandidates.filter((c) =>
      c.resolvedUrl.includes("/styles/"),
    );
    expect(cssAssets.length).toBe(1);
    expect(cssAssets[0].resolvedUrl).toBe(
      "https://example.com/styles/main.css",
    );
  });

  it("should discover srcset entries", async () => {
    const ctx = createContext(simplePageHtml);
    const next = async () => {};

    await handler.handle(ctx, next);

    const srcsetAssets = ctx.assetCandidates.filter(
      (c) => c.attribute === "srcset",
    );
    expect(srcsetAssets.length).toBe(2);
  });

  it("should skip data URLs, javascript:, and fragment links", async () => {
    const ctx = createContext(noAssetsPageHtml);
    const next = async () => {};

    await handler.handle(ctx, next);

    expect(ctx.assetCandidates.length).toBe(0);
  });

  it("should discover inline CSS url() references", async () => {
    const ctx = createContext(complexPageHtml, "https://example.com");
    const next = async () => {};

    await handler.handle(ctx, next);

    const inlineCssAssets = ctx.assetCandidates.filter(
      (c) => c.attribute === "inline-css",
    );
    expect(inlineCssAssets.length).toBeGreaterThan(0);
  });

  it("should discover inline style url() references", async () => {
    const ctx = createContext(complexPageHtml, "https://example.com");
    const next = async () => {};

    await handler.handle(ctx, next);

    const inlineStyleAssets = ctx.assetCandidates.filter(
      (c) => c.attribute === "inline-style",
    );
    expect(inlineStyleAssets.length).toBeGreaterThan(0);
  });

  it("should discover video poster", async () => {
    const ctx = createContext(complexPageHtml, "https://example.com");
    const next = async () => {};

    await handler.handle(ctx, next);

    const posterAssets = ctx.assetCandidates.filter((c) =>
      c.resolvedUrl.includes("poster"),
    );
    expect(posterAssets.length).toBe(1);
  });

  it("should set stats.discovered", async () => {
    const ctx = createContext(simplePageHtml);
    const next = async () => {};

    await handler.handle(ctx, next);

    expect(ctx.stats.discovered).toBe(ctx.assetCandidates.length);
    expect(ctx.stats.discovered).toBeGreaterThan(0);
  });

  it("should deduplicate URLs", async () => {
    const html = `
      <html><body>
        <img src="/images/logo.png">
        <img src="/images/logo.png">
      </body></html>
    `;
    const ctx = createContext(html);
    const next = async () => {};

    await handler.handle(ctx, next);

    const logoAssets = ctx.assetCandidates.filter((c) =>
      c.resolvedUrl.includes("logo.png"),
    );
    expect(logoAssets.length).toBe(1);
  });

  it("should resolve relative URLs against base", async () => {
    const ctx = createContext(simplePageHtml, "https://example.com/app/");
    const next = async () => {};

    await handler.handle(ctx, next);

    const cssAsset = ctx.assetCandidates.find((c) =>
      c.resolvedUrl.includes("main.css"),
    );
    expect(cssAsset).toBeDefined();
    expect(cssAsset!.resolvedUrl).toMatch(/^https:\/\/example\.com/);
  });

  it("should call next()", async () => {
    const ctx = createContext(noAssetsPageHtml);
    let nextCalled = false;
    const next = async () => {
      nextCalled = true;
    };

    await handler.handle(ctx, next);
    expect(nextCalled).toBe(true);
  });
});
