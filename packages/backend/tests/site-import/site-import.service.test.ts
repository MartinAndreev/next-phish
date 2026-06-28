import { describe, it, expect } from "vitest";
import { SiteImportService } from "../../src/site-import/services/site-import.service";

describe("SiteImportService", () => {
  const service = new SiteImportService();

  describe("buildAssetUrl", () => {
    it("should build a correct asset URL", () => {
      const url = service.buildAssetUrl("import-123", "sif-abc", "main.css");
      expect(url).toBe("/api/imports/import-123/assets/sif-abc/main.css");
    });

    it("should handle nested paths", () => {
      const url = service.buildAssetUrl(
        "import-456",
        "sif-xyz",
        "custom.woff2",
      );
      expect(url).toBe("/api/imports/import-456/assets/sif-xyz/custom.woff2");
    });
  });

  describe("generateLocalPath", () => {
    it("should extract path from absolute URL", () => {
      const path = service.generateLocalPath(
        "https://example.com/styles/main.css",
      );
      expect(path).toBe("styles/main.css");
    });

    it("should handle root path", () => {
      const path = service.generateLocalPath("https://example.com/");
      expect(path).toBe("index.html");
    });

    it("should handle path without trailing slash", () => {
      const path = service.generateLocalPath("https://example.com");
      expect(path).toBe("index.html");
    });

    it("should handle nested paths", () => {
      const path = service.generateLocalPath(
        "https://cdn.example.com/assets/js/app.min.js",
      );
      expect(path).toBe("assets/js/app.min.js");
    });

    it("should handle paths with query strings", () => {
      const path = service.generateLocalPath(
        "https://example.com/styles/main.css?v=123",
      );
      expect(path).toBe("styles/main.css");
    });
  });

  describe("generateRemoteId", () => {
    it("should generate a remote ID with org and import prefix", () => {
      const remoteId = service.generateRemoteId(
        "org-1",
        "import-1",
        "test.css",
      );
      expect(remoteId).toMatch(/^org-1\/site-imports\/import-1\/.+$/);
      expect(remoteId).toContain("test.css");
    });

    it("should generate unique IDs for the same inputs", () => {
      const id1 = service.generateRemoteId("org-1", "import-1", "test.css");
      const id2 = service.generateRemoteId("org-1", "import-1", "test.css");
      expect(id1).not.toBe(id2);
    });
  });
});
