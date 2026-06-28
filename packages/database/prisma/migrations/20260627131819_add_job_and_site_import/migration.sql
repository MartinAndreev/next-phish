-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'PARTIAL', 'FAILED');

-- CreateTable
CREATE TABLE "job" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "input" JSONB NOT NULL,
    "output" JSONB,
    "progress" JSONB,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_import" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "finalUrl" TEXT,
    "status" "ImportStatus" NOT NULL DEFAULT 'PENDING',
    "includeAssets" BOOLEAN NOT NULL DEFAULT false,
    "html" TEXT,
    "assetDiscovered" INTEGER NOT NULL DEFAULT 0,
    "assetDownloaded" INTEGER NOT NULL DEFAULT 0,
    "assetFailed" INTEGER NOT NULL DEFAULT 0,
    "assetSkipped" INTEGER NOT NULL DEFAULT 0,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_import_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_import_file" (
    "id" TEXT NOT NULL,
    "siteImportId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "resolvedUrl" TEXT NOT NULL,
    "localPath" TEXT NOT NULL,
    "contentHash" TEXT,
    "downloadStatus" TEXT NOT NULL DEFAULT 'downloaded',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_import_file_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "job_organizationId_idx" ON "job"("organizationId");

-- CreateIndex
CREATE INDEX "job_createdById_idx" ON "job"("createdById");

-- CreateIndex
CREATE INDEX "job_status_idx" ON "job"("status");

-- CreateIndex
CREATE INDEX "job_type_idx" ON "job"("type");

-- CreateIndex
CREATE UNIQUE INDEX "site_import_jobId_key" ON "site_import"("jobId");

-- CreateIndex
CREATE INDEX "site_import_organizationId_idx" ON "site_import"("organizationId");

-- CreateIndex
CREATE INDEX "site_import_createdById_idx" ON "site_import"("createdById");

-- CreateIndex
CREATE INDEX "site_import_file_siteImportId_idx" ON "site_import_file"("siteImportId");

-- CreateIndex
CREATE UNIQUE INDEX "site_import_file_siteImportId_resolvedUrl_key" ON "site_import_file"("siteImportId", "resolvedUrl");

-- AddForeignKey
ALTER TABLE "job" ADD CONSTRAINT "job_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job" ADD CONSTRAINT "job_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_import" ADD CONSTRAINT "site_import_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_import" ADD CONSTRAINT "site_import_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_import" ADD CONSTRAINT "site_import_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_import_file" ADD CONSTRAINT "site_import_file_siteImportId_fkey" FOREIGN KEY ("siteImportId") REFERENCES "site_import"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_import_file" ADD CONSTRAINT "site_import_file_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "file"("id") ON DELETE CASCADE ON UPDATE CASCADE;
