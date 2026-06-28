import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import {
  insertUser,
  insertOrganization,
  insertJob,
  insertSiteImport,
  insertFile,
  insertSiteImportFile,
} from "@next-phish/database/src/test-db";
import { getDb } from "../setup";

describe("SiteImport Repository (PGlite)", () => {
  let db: PGlite;
  let orgId: string;
  let userId: string;

  beforeAll(() => {
    db = getDb();
  });

  beforeEach(async () => {
    const user = await insertUser(db);
    const org = await insertOrganization(db);
    userId = user.id;
    orgId = org.id;
  });

  describe("site_import CRUD", () => {
    it("should create a site import record", async () => {
      const job = await insertJob(db, orgId, userId);
      const siteImport = await insertSiteImport(db, job.id, orgId, userId, {
        url: "https://example.com",
        includeAssets: false,
      });

      const result = await db.query(
        `SELECT * FROM "site_import" WHERE id = $1`,
        [siteImport.id],
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].jobId).toBe(job.id);
      expect(result.rows[0].url).toBe("https://example.com");
      expect(result.rows[0].includeAssets).toBe(false);
      expect(result.rows[0].status).toBe("PENDING");
    });

    it("should find import by job ID", async () => {
      const job = await insertJob(db, orgId, userId);
      await insertSiteImport(db, job.id, orgId, userId);

      const result = await db.query(
        `SELECT * FROM "site_import" WHERE "jobId" = $1`,
        [job.id],
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].jobId).toBe(job.id);
    });

    it("should return empty for non-existent job ID", async () => {
      const result = await db.query(
        `SELECT * FROM "site_import" WHERE "jobId" = $1`,
        ["non-existent"],
      );

      expect(result.rows.length).toBe(0);
    });

    it("should update import status and html", async () => {
      const job = await insertJob(db, orgId, userId);
      const siteImport = await insertSiteImport(db, job.id, orgId, userId);

      await db.query(
        `UPDATE "site_import" SET status = 'COMPLETED', html = $1, "finalUrl" = $2 WHERE id = $3`,
        ["<html></html>", "https://example.com", siteImport.id],
      );

      const result = await db.query(
        `SELECT status, html, "finalUrl" FROM "site_import" WHERE id = $1`,
        [siteImport.id],
      );

      expect(result.rows[0].status).toBe("COMPLETED");
      expect(result.rows[0].html).toBe("<html></html>");
      expect(result.rows[0].finalUrl).toBe("https://example.com");
    });

    it("should update asset stats", async () => {
      const job = await insertJob(db, orgId, userId);
      const siteImport = await insertSiteImport(db, job.id, orgId, userId, {
        includeAssets: true,
      });

      await db.query(
        `UPDATE "site_import" SET "assetDiscovered" = 10, "assetDownloaded" = 8, "assetFailed" = 2 WHERE id = $1`,
        [siteImport.id],
      );

      const result = await db.query(
        `SELECT "assetDiscovered", "assetDownloaded", "assetFailed" FROM "site_import" WHERE id = $1`,
        [siteImport.id],
      );

      expect(result.rows[0].assetDiscovered).toBe(10);
      expect(result.rows[0].assetDownloaded).toBe(8);
      expect(result.rows[0].assetFailed).toBe(2);
    });

    it("should delete a site import", async () => {
      const job = await insertJob(db, orgId, userId);
      const siteImport = await insertSiteImport(db, job.id, orgId, userId);

      await db.query(`DELETE FROM "site_import" WHERE id = $1`, [
        siteImport.id,
      ]);

      const result = await db.query(
        `SELECT * FROM "site_import" WHERE id = $1`,
        [siteImport.id],
      );
      expect(result.rows.length).toBe(0);
    });
  });

  describe("site_import_file CRUD", () => {
    it("should create a site import file record", async () => {
      const job = await insertJob(db, orgId, userId);
      const siteImport = await insertSiteImport(db, job.id, orgId, userId, {
        includeAssets: true,
      });
      const file = await insertFile(db, orgId, userId);

      const sif = await insertSiteImportFile(db, siteImport.id, file.id, {
        originalUrl: "https://example.com/styles/main.css",
        resolvedUrl: "https://example.com/styles/main.css",
        localPath: "styles/main.css",
      });

      const result = await db.query(
        `SELECT * FROM "site_import_file" WHERE id = $1`,
        [sif.id],
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].siteImportId).toBe(siteImport.id);
      expect(result.rows[0].fileId).toBe(file.id);
      expect(result.rows[0].localPath).toBe("styles/main.css");
    });

    it("should find file by local path", async () => {
      const job = await insertJob(db, orgId, userId);
      const siteImport = await insertSiteImport(db, job.id, orgId, userId, {
        includeAssets: true,
      });
      const file = await insertFile(db, orgId, userId, {
        remoteId: "remote-test",
        format: "application/javascript",
      });

      await insertSiteImportFile(db, siteImport.id, file.id, {
        originalUrl: "https://example.com/scripts/app.js",
        resolvedUrl: "https://example.com/scripts/app.js",
        localPath: "scripts/app.js",
      });

      const result = await db.query(
        `SELECT sif.*, f."remoteId", f.format
         FROM "site_import_file" sif
         JOIN "file" f ON f.id = sif."fileId"
         WHERE sif."siteImportId" = $1 AND sif."localPath" = $2`,
        [siteImport.id, "scripts/app.js"],
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].localPath).toBe("scripts/app.js");
      expect(result.rows[0].remoteId).toBe("remote-test");
      expect(result.rows[0].format).toBe("application/javascript");
    });

    it("should return empty for non-existent local path", async () => {
      const result = await db.query(
        `SELECT * FROM "site_import_file" WHERE "siteImportId" = $1 AND "localPath" = $2`,
        ["import-1", "nonexistent.css"],
      );

      expect(result.rows.length).toBe(0);
    });

    it("should enforce unique constraint on (siteImportId, resolvedUrl)", async () => {
      const job = await insertJob(db, orgId, userId);
      const siteImport = await insertSiteImport(db, job.id, orgId, userId, {
        includeAssets: true,
      });
      const file1 = await insertFile(db, orgId, userId, { id: "file-a" });
      const file2 = await insertFile(db, orgId, userId, { id: "file-b" });

      await insertSiteImportFile(db, siteImport.id, file1.id, {
        resolvedUrl: "https://example.com/same.css",
        localPath: "same.css",
      });

      await expect(
        insertSiteImportFile(db, siteImport.id, file2.id, {
          resolvedUrl: "https://example.com/same.css",
          localPath: "same.css",
        }),
      ).rejects.toThrow();
    });

    it("should cascade delete when site import is deleted", async () => {
      const job = await insertJob(db, orgId, userId);
      const siteImport = await insertSiteImport(db, job.id, orgId, userId, {
        includeAssets: true,
      });
      const file = await insertFile(db, orgId, userId);

      await insertSiteImportFile(db, siteImport.id, file.id, {
        localPath: "test.css",
      });

      await db.query(`DELETE FROM "site_import" WHERE id = $1`, [
        siteImport.id,
      ]);

      const result = await db.query(
        `SELECT * FROM "site_import_file" WHERE "siteImportId" = $1`,
        [siteImport.id],
      );
      expect(result.rows.length).toBe(0);
    });
  });
});
