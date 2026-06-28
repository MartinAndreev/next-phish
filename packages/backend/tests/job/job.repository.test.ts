import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import {
  insertUser,
  insertOrganization,
  insertJob,
} from "@next-phish/database/src/test-db";
import { getDb } from "../setup";

describe("Job Repository (PGlite)", () => {
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

  describe("create", () => {
    it("should create a job with PENDING status", async () => {
      const job = await insertJob(db, orgId, userId, {
        type: "site_import",
        input: { url: "https://example.com", includeAssets: false },
      });

      const result = await db.query(`SELECT * FROM "job" WHERE id = $1`, [
        job.id,
      ]);

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].type).toBe("site_import");
      expect(result.rows[0].status).toBe("PENDING");
      expect(result.rows[0].organizationId).toBe(orgId);
      expect(result.rows[0].createdById).toBe(userId);
    });

    it("should store input as JSON", async () => {
      const input = { url: "https://example.com", includeAssets: true };
      const job = await insertJob(db, orgId, userId, { input });

      const result = await db.query(`SELECT input FROM "job" WHERE id = $1`, [
        job.id,
      ]);

      expect(result.rows[0].input).toEqual(input);
    });
  });

  describe("findById", () => {
    it("should find an existing job", async () => {
      const created = await insertJob(db, orgId, userId);

      const result = await db.query(`SELECT * FROM "job" WHERE id = $1`, [
        created.id,
      ]);

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].id).toBe(created.id);
    });

    it("should return empty for non-existent job", async () => {
      const result = await db.query(`SELECT * FROM "job" WHERE id = $1`, [
        "non-existent-id",
      ]);

      expect(result.rows.length).toBe(0);
    });
  });

  describe("update", () => {
    it("should update job status", async () => {
      const job = await insertJob(db, orgId, userId);

      await db.query(
        `UPDATE "job" SET status = 'RUNNING', "startedAt" = NOW() WHERE id = $1`,
        [job.id],
      );

      const result = await db.query(
        `SELECT status, "startedAt" FROM "job" WHERE id = $1`,
        [job.id],
      );

      expect(result.rows[0].status).toBe("RUNNING");
      expect(result.rows[0].startedAt).toBeDefined();
    });

    it("should update job output on completion", async () => {
      const job = await insertJob(db, orgId, userId);
      const output = { html: "<html></html>", stats: { discovered: 5 } };

      await db.query(
        `UPDATE "job" SET status = 'COMPLETED', output = $1::jsonb, "completedAt" = NOW() WHERE id = $2`,
        [JSON.stringify(output), job.id],
      );

      const result = await db.query(
        `SELECT status, output FROM "job" WHERE id = $1`,
        [job.id],
      );

      expect(result.rows[0].status).toBe("COMPLETED");
      expect(result.rows[0].output).toEqual(output);
    });

    it("should list jobs by organization", async () => {
      await insertJob(db, orgId, userId, { type: "site_import" });
      await insertJob(db, orgId, userId, { type: "email_send" });

      const result = await db.query(
        `SELECT * FROM "job" WHERE "organizationId" = $1`,
        [orgId],
      );

      expect(result.rows.length).toBe(2);
    });

    it("should delete a job", async () => {
      const job = await insertJob(db, orgId, userId);

      await db.query(`DELETE FROM "job" WHERE id = $1`, [job.id]);

      const result = await db.query(`SELECT * FROM "job" WHERE id = $1`, [
        job.id,
      ]);
      expect(result.rows.length).toBe(0);
    });
  });
});
