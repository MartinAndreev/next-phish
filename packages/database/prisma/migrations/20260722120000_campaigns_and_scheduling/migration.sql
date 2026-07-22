-- CreateEnum
CREATE TYPE "ResourceVisibility" AS ENUM ('CATALOG', 'SHADOW');

-- CreateEnum
CREATE TYPE "PreviewStatus" AS ENUM ('MISSING', 'PENDING', 'READY', 'FAILED', 'STALE');

-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM ('TEMPLATE', 'CONCRETE');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'SCHEDULED', 'PENDING_START', 'ACTIVE', 'PAUSED', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ScheduleType" AS ENUM ('ONE_TIME', 'RECURRING');

-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'RUNNING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ScheduleSelectionStrategy" AS ENUM ('DECK', 'RANDOM');

-- CreateEnum
CREATE TYPE "RecurrenceFrequency" AS ENUM ('WEEKLY', 'MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "DeliveryMode" AS ENUM ('BLAST', 'DRIP', 'BATCH');

-- AlterEnum
ALTER TYPE "FilePurpose" ADD VALUE 'CATALOG_PREVIEW';

-- DropIndex
DROP INDEX "file_organizationId_idx";

-- DropIndex
DROP INDEX "file_purpose_idx";

-- DropIndex
DROP INDEX "email_template_organizationId_idx";

-- DropIndex
DROP INDEX "page_organizationId_idx";

-- DropIndex
DROP INDEX "target_group_organizationId_idx";

-- DropIndex
DROP INDEX "mail_sending_profile_organizationId_idx";

-- AlterTable
ALTER TABLE "organization" ADD COLUMN     "defaultTimezone" TEXT NOT NULL DEFAULT 'UTC';

-- AlterTable
ALTER TABLE "file"
ADD COLUMN "shadowCampaignId" TEXT,
ADD COLUMN "sourceFileId" TEXT,
ADD COLUMN "storedObjectId" TEXT,
ADD COLUMN "visibility" "ResourceVisibility" NOT NULL DEFAULT 'CATALOG';

-- AlterTable
ALTER TABLE "email_template" ADD COLUMN     "contentRevision" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "shadowCampaignId" TEXT,
ADD COLUMN     "sourceTemplateId" TEXT,
ADD COLUMN     "visibility" "ResourceVisibility" NOT NULL DEFAULT 'CATALOG';

-- AlterTable
ALTER TABLE "page" ADD COLUMN     "contentRevision" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "shadowCampaignId" TEXT,
ADD COLUMN     "sourcePageId" TEXT,
ADD COLUMN     "visibility" "ResourceVisibility" NOT NULL DEFAULT 'CATALOG';

-- AlterTable
ALTER TABLE "target_group" ADD COLUMN     "shadowCampaignId" TEXT,
ADD COLUMN     "sourceTargetGroupId" TEXT,
ADD COLUMN     "visibility" "ResourceVisibility" NOT NULL DEFAULT 'CATALOG';

-- AlterTable
ALTER TABLE "target_group_user" ADD COLUMN     "normalizedEmail" TEXT;

-- AlterTable
ALTER TABLE "mail_sending_profile" ADD COLUMN     "shadowCampaignId" TEXT,
ADD COLUMN     "sourceSendingProfileId" TEXT,
ADD COLUMN     "visibility" "ResourceVisibility" NOT NULL DEFAULT 'CATALOG';

-- CreateTable
CREATE TABLE "stored_object" (
    "id" TEXT NOT NULL,
    "remoteId" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "format" TEXT NOT NULL,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stored_object_pkey" PRIMARY KEY ("id")
);

-- Preserve every existing R2 object and file reference before removing file.remoteId.
INSERT INTO "stored_object" ("id", "remoteId", "size", "format", "organizationId", "createdAt")
SELECT DISTINCT ON ("remoteId")
  'so_' || md5("remoteId"), "remoteId", "size", "format", "organizationId", "createdAt"
FROM "file"
ORDER BY "remoteId", "createdAt";

UPDATE "file" f
SET "storedObjectId" = so."id"
FROM "stored_object" so
WHERE so."remoteId" = f."remoteId";

ALTER TABLE "file" ALTER COLUMN "storedObjectId" SET NOT NULL;
ALTER TABLE "file" DROP COLUMN "remoteId";

-- CreateTable
CREATE TABLE "catalog_preview" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "emailTemplateId" TEXT,
    "pageId" TEXT,
    "fileId" TEXT,
    "sourceRevision" INTEGER NOT NULL,
    "rendererVersion" INTEGER NOT NULL DEFAULT 1,
    "status" "PreviewStatus" NOT NULL DEFAULT 'PENDING',
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_preview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CampaignType" NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "emailTemplateId" TEXT,
    "pageId" TEXT,
    "mailSendingProfileId" TEXT,
    "targetGroupId" TEXT,
    "targetTimezone" TEXT NOT NULL,
    "autoCompleteAfterDays" INTEGER DEFAULT 20,
    "sourceCampaignId" TEXT,
    "scheduleId" TEXT,
    "occurrenceAt" TIMESTAMPTZ(3),
    "brokenAt" TIMESTAMP(3),
    "brokenReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "targetGroupId" TEXT,
    "name" TEXT NOT NULL,
    "type" "ScheduleType" NOT NULL,
    "status" "ScheduleStatus" NOT NULL DEFAULT 'DRAFT',
    "targetTimezone" TEXT NOT NULL,
    "startsAt" TIMESTAMPTZ(3) NOT NULL,
    "frequency" "RecurrenceFrequency",
    "localTimeMinutes" INTEGER,
    "weekday" INTEGER,
    "dayOfMonth" INTEGER,
    "month" INTEGER,
    "selectionStrategy" "ScheduleSelectionStrategy",
    "shuffleDeck" BOOLEAN NOT NULL DEFAULT false,
    "deliveryMode" "DeliveryMode" NOT NULL,
    "dripEmailsPerMinute" INTEGER,
    "batchSize" INTEGER,
    "batchIntervalMinutes" INTEGER,
    "maxCampaigns" INTEGER,
    "endsAt" TIMESTAMPTZ(3),
    "autoCompleteAfterDays" INTEGER DEFAULT 20,
    "nextOccurrenceAt" TIMESTAMPTZ(3),
    "cancelledAt" TIMESTAMPTZ(3),
    "completedAt" TIMESTAMPTZ(3),
    "brokenAt" TIMESTAMP(3),
    "brokenReason" TEXT,
    "collisionFingerprint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_source" (
    "scheduleId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "schedule_source_pkey" PRIMARY KEY ("scheduleId","campaignId")
);

-- CreateIndex
CREATE UNIQUE INDEX "stored_object_remoteId_key" ON "stored_object"("remoteId");

-- CreateIndex
CREATE INDEX "stored_object_organizationId_idx" ON "stored_object"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "catalog_preview_emailTemplateId_key" ON "catalog_preview"("emailTemplateId");

-- CreateIndex
CREATE UNIQUE INDEX "catalog_preview_pageId_key" ON "catalog_preview"("pageId");

-- CreateIndex
CREATE UNIQUE INDEX "catalog_preview_fileId_key" ON "catalog_preview"("fileId");

-- CreateIndex
CREATE INDEX "catalog_preview_organizationId_status_idx" ON "catalog_preview"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_scheduleId_occurrenceAt_key" ON "campaign"("scheduleId", "occurrenceAt");

-- CreateIndex
CREATE INDEX "campaign_organizationId_type_status_idx" ON "campaign"("organizationId", "type", "status");

-- CreateIndex
CREATE INDEX "campaign_scheduleId_status_idx" ON "campaign"("scheduleId", "status");

-- CreateIndex
CREATE INDEX "campaign_sourceCampaignId_idx" ON "campaign"("sourceCampaignId");

-- CreateIndex
CREATE INDEX "schedule_organizationId_status_startsAt_idx" ON "schedule"("organizationId", "status", "startsAt");

-- CreateIndex
CREATE INDEX "schedule_targetGroupId_idx" ON "schedule"("targetGroupId");

-- CreateIndex
CREATE INDEX "schedule_collisionFingerprint_idx" ON "schedule"("collisionFingerprint");

-- CreateIndex
CREATE INDEX "schedule_source_campaignId_idx" ON "schedule_source"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "schedule_source_scheduleId_position_key" ON "schedule_source"("scheduleId", "position");

-- CreateIndex
CREATE INDEX "file_organizationId_visibility_purpose_idx" ON "file"("organizationId", "visibility", "purpose");

-- CreateIndex
CREATE INDEX "file_storedObjectId_idx" ON "file"("storedObjectId");

-- CreateIndex
CREATE INDEX "file_shadowCampaignId_idx" ON "file"("shadowCampaignId");

-- CreateIndex
CREATE INDEX "email_template_organizationId_visibility_idx" ON "email_template"("organizationId", "visibility");

-- CreateIndex
CREATE INDEX "email_template_shadowCampaignId_idx" ON "email_template"("shadowCampaignId");

-- CreateIndex
CREATE INDEX "page_organizationId_visibility_idx" ON "page"("organizationId", "visibility");

-- CreateIndex
CREATE INDEX "page_shadowCampaignId_idx" ON "page"("shadowCampaignId");

-- CreateIndex
CREATE INDEX "target_group_organizationId_visibility_idx" ON "target_group"("organizationId", "visibility");

-- CreateIndex
CREATE INDEX "target_group_shadowCampaignId_idx" ON "target_group"("shadowCampaignId");

-- CreateIndex
CREATE UNIQUE INDEX "target_group_user_targetGroupId_normalizedEmail_key" ON "target_group_user"("targetGroupId", "normalizedEmail");

-- CreateIndex
CREATE INDEX "mail_sending_profile_organizationId_visibility_idx" ON "mail_sending_profile"("organizationId", "visibility");

-- CreateIndex
CREATE INDEX "mail_sending_profile_shadowCampaignId_idx" ON "mail_sending_profile"("shadowCampaignId");

-- Enforce model invariants that Prisma cannot express.
ALTER TABLE "catalog_preview" ADD CONSTRAINT "catalog_preview_exactly_one_resource_check"
CHECK (("emailTemplateId" IS NOT NULL)::int + ("pageId" IS NOT NULL)::int = 1);
ALTER TABLE "campaign" ADD CONSTRAINT "campaign_auto_complete_positive_check"
CHECK ("autoCompleteAfterDays" IS NULL OR "autoCompleteAfterDays" > 0);
ALTER TABLE "file" ADD CONSTRAINT "file_shadow_ownership_check"
CHECK (("visibility" = 'CATALOG' AND "shadowCampaignId" IS NULL)
  OR ("visibility" = 'SHADOW' AND "shadowCampaignId" IS NOT NULL));
ALTER TABLE "email_template" ADD CONSTRAINT "email_template_shadow_ownership_check"
CHECK (("visibility" = 'CATALOG' AND "shadowCampaignId" IS NULL)
  OR ("visibility" = 'SHADOW' AND "shadowCampaignId" IS NOT NULL));
ALTER TABLE "page" ADD CONSTRAINT "page_shadow_ownership_check"
CHECK (("visibility" = 'CATALOG' AND "shadowCampaignId" IS NULL)
  OR ("visibility" = 'SHADOW' AND "shadowCampaignId" IS NOT NULL));
ALTER TABLE "target_group" ADD CONSTRAINT "target_group_shadow_ownership_check"
CHECK (("visibility" = 'CATALOG' AND "shadowCampaignId" IS NULL)
  OR ("visibility" = 'SHADOW' AND "shadowCampaignId" IS NOT NULL));
ALTER TABLE "mail_sending_profile" ADD CONSTRAINT "mail_sending_profile_shadow_ownership_check"
CHECK (("visibility" = 'CATALOG' AND "shadowCampaignId" IS NULL)
  OR ("visibility" = 'SHADOW' AND "shadowCampaignId" IS NOT NULL AND "isDefault" = false));
ALTER TABLE "schedule" ADD CONSTRAINT "schedule_positive_values_check"
CHECK (("dripEmailsPerMinute" IS NULL OR "dripEmailsPerMinute" > 0)
  AND ("batchSize" IS NULL OR "batchSize" > 0)
  AND ("batchIntervalMinutes" IS NULL OR "batchIntervalMinutes" > 0)
  AND ("maxCampaigns" IS NULL OR "maxCampaigns" > 0)
  AND ("autoCompleteAfterDays" IS NULL OR "autoCompleteAfterDays" > 0)
  AND ("localTimeMinutes" IS NULL OR "localTimeMinutes" BETWEEN 0 AND 1439)
  AND ("weekday" IS NULL OR "weekday" BETWEEN 0 AND 6)
  AND ("dayOfMonth" IS NULL OR "dayOfMonth" BETWEEN 1 AND 31)
  AND ("month" IS NULL OR "month" BETWEEN 1 AND 12));

-- AddForeignKey
ALTER TABLE "stored_object" ADD CONSTRAINT "stored_object_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_storedObjectId_fkey" FOREIGN KEY ("storedObjectId") REFERENCES "stored_object"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_shadowCampaignId_fkey" FOREIGN KEY ("shadowCampaignId") REFERENCES "campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_sourceFileId_fkey" FOREIGN KEY ("sourceFileId") REFERENCES "file"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_template" ADD CONSTRAINT "email_template_shadowCampaignId_fkey" FOREIGN KEY ("shadowCampaignId") REFERENCES "campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_template" ADD CONSTRAINT "email_template_sourceTemplateId_fkey" FOREIGN KEY ("sourceTemplateId") REFERENCES "email_template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page" ADD CONSTRAINT "page_shadowCampaignId_fkey" FOREIGN KEY ("shadowCampaignId") REFERENCES "campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page" ADD CONSTRAINT "page_sourcePageId_fkey" FOREIGN KEY ("sourcePageId") REFERENCES "page"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "target_group" ADD CONSTRAINT "target_group_shadowCampaignId_fkey" FOREIGN KEY ("shadowCampaignId") REFERENCES "campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "target_group" ADD CONSTRAINT "target_group_sourceTargetGroupId_fkey" FOREIGN KEY ("sourceTargetGroupId") REFERENCES "target_group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_sending_profile" ADD CONSTRAINT "mail_sending_profile_shadowCampaignId_fkey" FOREIGN KEY ("shadowCampaignId") REFERENCES "campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_sending_profile" ADD CONSTRAINT "mail_sending_profile_sourceSendingProfileId_fkey" FOREIGN KEY ("sourceSendingProfileId") REFERENCES "mail_sending_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_preview" ADD CONSTRAINT "catalog_preview_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_preview" ADD CONSTRAINT "catalog_preview_emailTemplateId_fkey" FOREIGN KEY ("emailTemplateId") REFERENCES "email_template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_preview" ADD CONSTRAINT "catalog_preview_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_preview" ADD CONSTRAINT "catalog_preview_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "file"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign" ADD CONSTRAINT "campaign_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign" ADD CONSTRAINT "campaign_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign" ADD CONSTRAINT "campaign_emailTemplateId_fkey" FOREIGN KEY ("emailTemplateId") REFERENCES "email_template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign" ADD CONSTRAINT "campaign_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "page"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign" ADD CONSTRAINT "campaign_mailSendingProfileId_fkey" FOREIGN KEY ("mailSendingProfileId") REFERENCES "mail_sending_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign" ADD CONSTRAINT "campaign_targetGroupId_fkey" FOREIGN KEY ("targetGroupId") REFERENCES "target_group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign" ADD CONSTRAINT "campaign_sourceCampaignId_fkey" FOREIGN KEY ("sourceCampaignId") REFERENCES "campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign" ADD CONSTRAINT "campaign_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "schedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule" ADD CONSTRAINT "schedule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule" ADD CONSTRAINT "schedule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule" ADD CONSTRAINT "schedule_targetGroupId_fkey" FOREIGN KEY ("targetGroupId") REFERENCES "target_group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_source" ADD CONSTRAINT "schedule_source_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_source" ADD CONSTRAINT "schedule_source_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

