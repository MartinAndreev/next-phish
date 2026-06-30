import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { PrismaClient } from "@prisma/client";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { UserFactory } from "./user.factory";
import { OrganizationFactory } from "./organization.factory";
import { JobFactory } from "./job.factory";
import { SiteImportFactory } from "./site-import.factory";
import { FileFactory } from "./file.factory";
import { SiteImportFileFactory } from "./site-import-file.factory";
import { TargetGroupFactory } from "./target-group.factory";

export interface TestDatabase {
  prisma: PrismaClient;
  factories: {
    user: UserFactory;
    organization: OrganizationFactory;
    job: JobFactory;
    siteImport: SiteImportFactory;
    file: FileFactory;
    siteImportFile: SiteImportFileFactory;
    targetGroup: TargetGroupFactory;
  };
  cleanup: () => Promise<void>;
  resetData: () => Promise<void>;
}

function collectMigrationSql(): string {
  const migrationsDir = join(__dirname, "../../prisma/migrations");

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

  const port = 15432 + Math.floor(Math.random() * 1000);
  const server = new PGLiteSocketServer({
    db,
    port,
    host: "127.0.0.1",
  });
  await server.start();
  await new Promise((resolve) => setTimeout(resolve, 500));

  const url = `postgresql://postgres:postgres@127.0.0.1:${port}/postgres?sslmode=disable`;
  const prisma = new PrismaClient({
    datasources: { db: { url } },
  });
  await prisma.$connect();

  return {
    prisma,
    factories: {
      user: new UserFactory(prisma),
      organization: new OrganizationFactory(prisma),
      job: new JobFactory(prisma),
      siteImport: new SiteImportFactory(prisma),
      file: new FileFactory(prisma),
      siteImportFile: new SiteImportFileFactory(prisma),
      targetGroup: new TargetGroupFactory(prisma),
    },
    async cleanup() {
      await prisma.$disconnect();
      await server.stop();
      await db.close();
    },
    async resetData() {
      await prisma.targetGroupUser.deleteMany();
      await prisma.targetGroup.deleteMany();
      await prisma.siteImportFile.deleteMany();
      await prisma.siteImport.deleteMany();
      await prisma.job.deleteMany();
      await prisma.file.deleteMany();
      await prisma.pageSubmission.deleteMany();
      await prisma.page.deleteMany();
      await prisma.user.deleteMany();
      await prisma.organization.deleteMany();
    },
  };
}
