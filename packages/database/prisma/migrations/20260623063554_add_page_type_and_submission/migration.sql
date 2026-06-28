/*
  Warnings:

  - You are about to drop the column `enabled` on the `page` table. All the data in the column will be lost.
  - Added the required column `createdById` to the `page` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `page` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `page` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PageType" AS ENUM ('LANDING', 'REDIRECT');

-- CreateEnum
CREATE TYPE "PageStatus" AS ENUM ('DRAFT', 'ACTIVE');

-- AlterTable
ALTER TABLE "page" DROP COLUMN "enabled",
ADD COLUMN     "captureData" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "design" JSONB,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "organizationId" TEXT NOT NULL,
ADD COLUMN     "redirectPageId" TEXT,
ADD COLUMN     "redirectUrl" TEXT,
ADD COLUMN     "status" "PageStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "type" "PageType" NOT NULL DEFAULT 'LANDING',
ALTER COLUMN "html" SET DEFAULT '';

-- CreateTable
CREATE TABLE "page_submission" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_submission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "page_submission_pageId_idx" ON "page_submission"("pageId");

-- CreateIndex
CREATE INDEX "page_organizationId_idx" ON "page"("organizationId");

-- CreateIndex
CREATE INDEX "page_createdById_idx" ON "page"("createdById");

-- CreateIndex
CREATE INDEX "page_status_idx" ON "page"("status");

-- AddForeignKey
ALTER TABLE "page" ADD CONSTRAINT "page_redirectPageId_fkey" FOREIGN KEY ("redirectPageId") REFERENCES "page"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page" ADD CONSTRAINT "page_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page" ADD CONSTRAINT "page_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_submission" ADD CONSTRAINT "page_submission_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "page"("id") ON DELETE CASCADE ON UPDATE CASCADE;
