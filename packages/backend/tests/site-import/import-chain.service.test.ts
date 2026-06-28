import { describe, it, expect } from "vitest";
import { ImportChainService } from "../../src/site-import/services/import-chain.service";
import type { ImportContext, ImportHandler } from "../../src/site-import/types";

describe("ImportChainService", () => {
  function createContext(includeAssets = false): ImportContext {
    return {
      siteImportId: "test-import",
      organizationId: "test-org",
      createdById: "test-user",
      url: "https://example.com",
      html: undefined,
      $: null,
      assetCandidates: [],
      downloadedAssets: [],
      stats: { discovered: 0, downloaded: 0, failed: 0, skipped: 0 },
      warnings: [],
      includeAssets,
    };
  }

  function createMockHandler(): ImportHandler & { callCount: number } {
    return {
      callCount: 0,
      async handle(ctx: ImportContext, next: () => Promise<void>) {
        this.callCount++;
        await next();
      },
    };
  }

  it("should execute all handlers in order when includeAssets is false", async () => {
    const fetchHtml = createMockHandler();
    const parseHtml = createMockHandler();
    const discoverAssets = createMockHandler();
    const downloadAssets = createMockHandler();
    const rewriteReferences = createMockHandler();
    const finalize = createMockHandler();

    const chain = new ImportChainService(
      fetchHtml,
      parseHtml,
      discoverAssets,
      downloadAssets,
      rewriteReferences,
      finalize,
    );

    const ctx = createContext(false);
    await chain.run(ctx);

    expect(fetchHtml.callCount).toBe(1);
    expect(parseHtml.callCount).toBe(1);
    expect(finalize.callCount).toBe(1);
  });

  it("should skip asset handlers when includeAssets is false", async () => {
    const fetchHtml = createMockHandler();
    const parseHtml = createMockHandler();
    const discoverAssets = createMockHandler();
    const downloadAssets = createMockHandler();
    const rewriteReferences = createMockHandler();
    const finalize = createMockHandler();

    const chain = new ImportChainService(
      fetchHtml,
      parseHtml,
      discoverAssets,
      downloadAssets,
      rewriteReferences,
      finalize,
    );

    const ctx = createContext(false);
    await chain.run(ctx);

    expect(discoverAssets.callCount).toBe(0);
    expect(downloadAssets.callCount).toBe(0);
    expect(rewriteReferences.callCount).toBe(0);
  });

  it("should execute all handlers when includeAssets is true", async () => {
    const fetchHtml = createMockHandler();
    const parseHtml = createMockHandler();
    const discoverAssets = createMockHandler();
    const downloadAssets = createMockHandler();
    const rewriteReferences = createMockHandler();
    const finalize = createMockHandler();

    const chain = new ImportChainService(
      fetchHtml,
      parseHtml,
      discoverAssets,
      downloadAssets,
      rewriteReferences,
      finalize,
    );

    const ctx = createContext(true);
    await chain.run(ctx);

    expect(fetchHtml.callCount).toBe(1);
    expect(parseHtml.callCount).toBe(1);
    expect(discoverAssets.callCount).toBe(1);
    expect(downloadAssets.callCount).toBe(1);
    expect(rewriteReferences.callCount).toBe(1);
    expect(finalize.callCount).toBe(1);
  });

  it("should stop chain on handler error", async () => {
    const fetchHtml: ImportHandler = {
      async handle() {
        throw new Error("Fetch failed");
      },
    };
    const parseHtml = createMockHandler();
    const discoverAssets = createMockHandler();
    const downloadAssets = createMockHandler();
    const rewriteReferences = createMockHandler();
    const finalize = createMockHandler();

    const chain = new ImportChainService(
      fetchHtml,
      parseHtml,
      discoverAssets,
      downloadAssets,
      rewriteReferences,
      finalize,
    );

    const ctx = createContext(false);
    await expect(chain.run(ctx)).rejects.toThrow("Fetch failed");
    expect(parseHtml.callCount).toBe(0);
    expect(finalize.callCount).toBe(0);
  });

  it("should allow handlers to mutate context", async () => {
    const fetchHtml: ImportHandler = {
      async handle(ctx, next) {
        ctx.html = "<html>test</html>";
        ctx.finalUrl = "https://final.example.com";
        await next();
      },
    };
    const parseHtml = createMockHandler();
    const discoverAssets = createMockHandler();
    const downloadAssets = createMockHandler();
    const rewriteReferences = createMockHandler();
    const finalize: ImportHandler = {
      async handle(ctx, next) {
        expect(ctx.html).toBe("<html>test</html>");
        expect(ctx.finalUrl).toBe("https://final.example.com");
        await next();
      },
    };

    const chain = new ImportChainService(
      fetchHtml,
      parseHtml,
      discoverAssets,
      downloadAssets,
      rewriteReferences,
      finalize,
    );

    const ctx = createContext(false);
    await chain.run(ctx);
  });
});
