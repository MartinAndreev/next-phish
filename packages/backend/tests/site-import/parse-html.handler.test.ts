import { describe, it, expect } from "vitest";
import { ParseAndNormalizeHandler } from "../../src/site-import/handlers/parse-html.handler";
import type { ImportContext } from "../../src/site-import/types";
import { simplePageHtml, noAssetsPageHtml } from "../data/fixtures";

describe("ParseAndNormalizeHandler", () => {
  const handler = new ParseAndNormalizeHandler();

  function createContext(
    html: string,
    url = "https://example.com",
  ): ImportContext {
    return {
      siteImportId: "test-import",
      organizationId: "test-org",
      createdById: "test-user",
      url,
      html,
      $: null,
      assetCandidates: [],
      downloadedAssets: [],
      stats: { discovered: 0, downloaded: 0, failed: 0, skipped: 0 },
      warnings: [],
      includeAssets: false,
    };
  }

  it("should parse HTML and set ctx.$", async () => {
    const ctx = createContext(simplePageHtml);
    const next = async () => {};

    await handler.handle(ctx, next);

    expect(ctx.$).toBeDefined();
    expect(ctx.$("h1").text()).toBe("Welcome to Test Page");
  });

  it("should inject base tag when missing", async () => {
    const ctx = createContext(simplePageHtml, "https://example.com/page");
    const next = async () => {};

    await handler.handle(ctx, next);

    const baseTag = ctx.$("base").attr("href");
    expect(baseTag).toBe("https://example.com/page");
  });

  it("should not inject base tag when already present", async () => {
    const ctx = createContext(
      '<html><head><base href="https://custom.com"></head><body></body></html>',
    );
    const next = async () => {};

    await handler.handle(ctx, next);

    expect(ctx.$("base").length).toBe(1);
    expect(ctx.$("base").attr("href")).toBe("https://custom.com");
  });

  it("should inject __original_url hidden field into forms", async () => {
    const ctx = createContext(simplePageHtml);
    const next = async () => {};

    await handler.handle(ctx, next);

    const hiddenFields = ctx.$('form input[name="__original_url"]');
    expect(hiddenFields.length).toBeGreaterThan(0);
    expect(hiddenFields.first().attr("value")).toBe("/login");
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

  it("should throw when html is missing", async () => {
    const ctx = createContext("");
    ctx.html = undefined;
    const next = async () => {};

    await expect(handler.handle(ctx, next)).rejects.toThrow("No HTML to parse");
  });
});
