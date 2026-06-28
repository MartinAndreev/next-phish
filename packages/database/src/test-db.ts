import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

export interface TestDatabase {
  db: PGlite;
  cleanup: () => Promise<void>;
  resetData: () => Promise<void>;
}

function collectMigrationSql(): string {
  const migrationsDir = join(__dirname, "../prisma/migrations");

  const dirs = readdirSync(migrationsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  const statements: string[] = [];

  for (const dir of dirs) {
    const sqlPath = join(migrationsDir, dir, "migration.sql");
    try {
      const sql = readFileSync(sqlPath, "utf-8");
      statements.push(sql);
    } catch {
      // skip missing migration files
    }
  }

  return statements.join("\n");
}

export async function createTestDatabase(): Promise<TestDatabase> {
  const db = new PGlite();

  const migrationSql = collectMigrationSql();
  await db.exec(migrationSql);

  return {
    db,
    async cleanup() {
      await db.close();
    },
    async resetData() {
      await db.exec(`
        DELETE FROM site_import_file;
        DELETE FROM site_import;
        DELETE FROM job;
        DELETE FROM file;
        DELETE FROM "user";
        DELETE FROM organization;
      `);
    },
  };
}

export async function insertUser(
  db: PGlite,
  overrides: Partial<{ id: string; name: string; email: string }> = {},
) {
  const id =
    overrides.id ??
    `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const name = overrides.name ?? "Test User";
  const email = overrides.email ?? `${id}@example.com`;
  await db.query(
    `INSERT INTO "user" (id, name, email, "emailVerified", "twoFactorEnabled", role, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, false, false, 'user', NOW(), NOW())`,
    [id, name, email],
  );
  return { id, name, email };
}

export async function insertOrganization(
  db: PGlite,
  overrides: Partial<{ id: string; name: string; slug: string }> = {},
) {
  const id =
    overrides.id ??
    `org-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const name = overrides.name ?? "Test Org";
  const slug = overrides.slug ?? `slug-${id}`;
  await db.query(
    `INSERT INTO "organization" (id, name, slug, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, NOW(), NOW())`,
    [id, name, slug],
  );
  return { id, name };
}

export async function insertJob(
  db: PGlite,
  orgId: string,
  userId: string,
  overrides: Partial<{
    id: string;
    type: string;
    status: string;
    input: unknown;
  }> = {},
) {
  const id =
    overrides.id ??
    `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const type = overrides.type ?? "site_import";
  const status = overrides.status ?? "PENDING";
  const input = JSON.stringify(
    overrides.input ?? { url: "https://example.com" },
  );
  await db.query(
    `INSERT INTO "job" (id, type, status, input, "organizationId", "createdById", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4::jsonb, $5, $6, NOW(), NOW())`,
    [id, type, status, input, orgId, userId],
  );
  return { id, type, status };
}

export async function insertSiteImport(
  db: PGlite,
  jobId: string,
  orgId: string,
  userId: string,
  overrides: Partial<{
    id: string;
    url: string;
    includeAssets: boolean;
    status: string;
  }> = {},
) {
  const id =
    overrides.id ??
    `import-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const url = overrides.url ?? "https://example.com";
  const includeAssets = overrides.includeAssets ?? false;
  const status = overrides.status ?? "PENDING";
  await db.query(
    `INSERT INTO "site_import" (id, "jobId", url, "includeAssets", status, "organizationId", "createdById", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
    [id, jobId, url, includeAssets, status, orgId, userId],
  );
  return { id };
}

export async function insertFile(
  db: PGlite,
  orgId: string,
  userId: string,
  overrides: Partial<{
    id: string;
    remoteId: string;
    name: string;
    size: number;
    format: string;
  }> = {},
) {
  const id =
    overrides.id ??
    `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const remoteId = overrides.remoteId ?? `remote-${id}`;
  const name = overrides.name ?? "test.css";
  const size = overrides.size ?? 1024;
  const format = overrides.format ?? "text/css";
  await db.query(
    `INSERT INTO "file" (id, "remoteId", name, size, format, purpose, "organizationId", "uploadedById", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, 'IMPORT', $6, $7, NOW(), NOW())`,
    [id, remoteId, name, size, format, orgId, userId],
  );
  return { id, remoteId };
}

export async function insertSiteImportFile(
  db: PGlite,
  siteImportId: string,
  fileId: string,
  overrides: Partial<{
    id: string;
    originalUrl: string;
    resolvedUrl: string;
    localPath: string;
  }> = {},
) {
  const id =
    overrides.id ??
    `sif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const originalUrl =
    overrides.originalUrl ?? "https://example.com/styles/main.css";
  const resolvedUrl = overrides.resolvedUrl ?? originalUrl;
  const localPath = overrides.localPath ?? "styles/main.css";
  await db.query(
    `INSERT INTO "site_import_file" (id, "siteImportId", "fileId", "originalUrl", "resolvedUrl", "localPath", "downloadStatus", "createdAt")
     VALUES ($1, $2, $3, $4, $5, $6, 'downloaded', NOW())`,
    [id, siteImportId, fileId, originalUrl, resolvedUrl, localPath],
  );
  return { id };
}
