-- CreateEnum
CREATE TYPE "OccurrenceStatus" AS ENUM ('PENDING', 'MATERIALIZING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RecipientDeliveryStatus" AS ENUM ('PLANNED', 'QUEUED', 'DISPATCHING', 'RETRYABLE', 'SENT', 'FAILED', 'DELIVERY_UNKNOWN', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NegativeEventSeverity" AS ENUM ('NONE', 'OPENED', 'CLICKED', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "CampaignEventType" AS ENUM ('SCHEDULED', 'SENT', 'OPENED', 'CLICKED', 'SUBMITTED', 'REPORTED', 'FAILED');

-- CreateEnum
CREATE TYPE "DeliveryEventType" AS ENUM ('QUEUED', 'DISPATCH_STARTED', 'ACCEPTED', 'DEFERRED', 'DELIVERED', 'BOUNCED', 'REJECTED', 'RETRY_SCHEDULED', 'DELIVERY_UNKNOWN', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'PUBLISHING', 'PUBLISHED', 'FAILED');

-- AlterTable
ALTER TABLE "campaign" ADD COLUMN     "expectedRecipientCount" INTEGER,
ADD COLUMN     "materializedAt" TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "schedule" ADD COLUMN     "executionEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "revision" INTEGER NOT NULL DEFAULT 1;

-- Existing schedules require an explicit operator review before execution.
UPDATE "schedule" SET "executionEnabled" = false;

-- CreateTable
CREATE TABLE "schedule_occurrence" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "occurrenceAt" TIMESTAMPTZ(3) NOT NULL,
    "scheduleRevision" INTEGER NOT NULL,
    "sourceCampaignId" TEXT NOT NULL,
    "campaignId" TEXT,
    "status" "OccurrenceStatus" NOT NULL DEFAULT 'PENDING',
    "materializationCursor" TEXT,
    "materializedRecipientCount" INTEGER NOT NULL DEFAULT 0,
    "leaseOwner" TEXT,
    "leaseExpiresAt" TIMESTAMPTZ(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMPTZ(3),

    CONSTRAINT "schedule_occurrence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_recipient" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "sourceUserId" TEXT,
    "email" TEXT NOT NULL,
    "normalizedEmail" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "position" TEXT,
    "mergeData" JSONB,
    "trackingRef" VARCHAR(12) NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "scheduledAt" TIMESTAMPTZ(3) NOT NULL,
    "deliveryStatus" "RecipientDeliveryStatus" NOT NULL DEFAULT 'PLANNED',
    "queuedAt" TIMESTAMPTZ(3),
    "dispatchStartedAt" TIMESTAMPTZ(3),
    "sentAt" TIMESTAMPTZ(3),
    "failedAt" TIMESTAMPTZ(3),
    "cancelledAt" TIMESTAMPTZ(3),
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "retryAt" TIMESTAMPTZ(3),
    "leaseOwner" TEXT,
    "leaseExpiresAt" TIMESTAMPTZ(3),
    "lastError" TEXT,
    "highestNegativeEvent" "NegativeEventSeverity" NOT NULL DEFAULT 'NONE',
    "highestNegativeEventAt" TIMESTAMPTZ(3),
    "reported" BOOLEAN NOT NULL DEFAULT false,
    "reportedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_recipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_tracking_link" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "linkId" VARCHAR(12) NOT NULL,
    "destinationUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_tracking_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_attempt" (
    "id" TEXT NOT NULL,
    "campaignRecipientId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "startedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ(3),
    "outcome" TEXT,
    "providerMessageId" TEXT,
    "errorCode" TEXT,
    "sanitizedError" TEXT,

    CONSTRAINT "delivery_attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_event" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "campaignRecipientId" TEXT NOT NULL,
    "type" "CampaignEventType" NOT NULL,
    "deduplicationKey" TEXT NOT NULL,
    "occurredAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_event" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "campaignRecipientId" TEXT NOT NULL,
    "type" "DeliveryEventType" NOT NULL,
    "deduplicationKey" TEXT NOT NULL,
    "providerEventId" TEXT,
    "metadata" JSONB,
    "occurredAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_event" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "topic" TEXT NOT NULL,
    "deduplicationKey" TEXT NOT NULL,
    "payloadVersion" INTEGER NOT NULL DEFAULT 1,
    "payload" JSONB NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
    "availableAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimedBy" TEXT,
    "claimedAt" TIMESTAMPTZ(3),
    "publishedAt" TIMESTAMPTZ(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outbox_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_ignored_network" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "normalizedNetwork" TEXT NOT NULL,
    "description" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_ignored_network_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "schedule_occurrence_campaignId_key" ON "schedule_occurrence"("campaignId");

-- CreateIndex
CREATE INDEX "schedule_occurrence_organizationId_status_occurrenceAt_idx" ON "schedule_occurrence"("organizationId", "status", "occurrenceAt");

-- CreateIndex
CREATE INDEX "schedule_occurrence_status_leaseExpiresAt_idx" ON "schedule_occurrence"("status", "leaseExpiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "schedule_occurrence_scheduleId_occurrenceAt_key" ON "schedule_occurrence"("scheduleId", "occurrenceAt");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_recipient_trackingRef_key" ON "campaign_recipient"("trackingRef");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_recipient_idempotencyKey_key" ON "campaign_recipient"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_recipient_messageId_key" ON "campaign_recipient"("messageId");

-- CreateIndex
CREATE INDEX "campaign_recipient_organizationId_deliveryStatus_scheduledA_idx" ON "campaign_recipient"("organizationId", "deliveryStatus", "scheduledAt");

-- CreateIndex
CREATE INDEX "campaign_recipient_campaignId_deliveryStatus_idx" ON "campaign_recipient"("campaignId", "deliveryStatus");

-- CreateIndex
CREATE INDEX "campaign_recipient_deliveryStatus_retryAt_leaseExpiresAt_idx" ON "campaign_recipient"("deliveryStatus", "retryAt", "leaseExpiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_recipient_campaignId_normalizedEmail_key" ON "campaign_recipient"("campaignId", "normalizedEmail");

-- CreateIndex
CREATE INDEX "campaign_tracking_link_linkId_idx" ON "campaign_tracking_link"("linkId");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_tracking_link_campaignId_linkId_key" ON "campaign_tracking_link"("campaignId", "linkId");

-- CreateIndex
CREATE INDEX "delivery_attempt_startedAt_idx" ON "delivery_attempt"("startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_attempt_campaignRecipientId_attemptNumber_key" ON "delivery_attempt"("campaignRecipientId", "attemptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_event_deduplicationKey_key" ON "campaign_event"("deduplicationKey");

-- CreateIndex
CREATE INDEX "campaign_event_campaignId_occurredAt_idx" ON "campaign_event"("campaignId", "occurredAt");

-- CreateIndex
CREATE INDEX "campaign_event_campaignRecipientId_type_idx" ON "campaign_event"("campaignRecipientId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_event_deduplicationKey_key" ON "delivery_event"("deduplicationKey");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_event_providerEventId_key" ON "delivery_event"("providerEventId");

-- CreateIndex
CREATE INDEX "delivery_event_campaignId_occurredAt_idx" ON "delivery_event"("campaignId", "occurredAt");

-- CreateIndex
CREATE INDEX "delivery_event_campaignRecipientId_type_idx" ON "delivery_event"("campaignRecipientId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "outbox_event_deduplicationKey_key" ON "outbox_event"("deduplicationKey");

-- CreateIndex
CREATE INDEX "outbox_event_status_availableAt_idx" ON "outbox_event"("status", "availableAt");

-- CreateIndex
CREATE INDEX "outbox_event_claimedAt_idx" ON "outbox_event"("claimedAt");

-- CreateIndex
CREATE INDEX "organization_ignored_network_organizationId_idx" ON "organization_ignored_network"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "organization_ignored_network_organizationId_normalizedNetwo_key" ON "organization_ignored_network"("organizationId", "normalizedNetwork");

-- CreateIndex
CREATE INDEX "schedule_status_executionEnabled_nextOccurrenceAt_idx" ON "schedule"("status", "executionEnabled", "nextOccurrenceAt");

-- AddForeignKey
ALTER TABLE "schedule_occurrence" ADD CONSTRAINT "schedule_occurrence_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_occurrence" ADD CONSTRAINT "schedule_occurrence_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_occurrence" ADD CONSTRAINT "schedule_occurrence_sourceCampaignId_fkey" FOREIGN KEY ("sourceCampaignId") REFERENCES "campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_occurrence" ADD CONSTRAINT "schedule_occurrence_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_recipient" ADD CONSTRAINT "campaign_recipient_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_recipient" ADD CONSTRAINT "campaign_recipient_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_tracking_link" ADD CONSTRAINT "campaign_tracking_link_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_attempt" ADD CONSTRAINT "delivery_attempt_campaignRecipientId_fkey" FOREIGN KEY ("campaignRecipientId") REFERENCES "campaign_recipient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_event" ADD CONSTRAINT "campaign_event_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_event" ADD CONSTRAINT "campaign_event_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_event" ADD CONSTRAINT "campaign_event_campaignRecipientId_fkey" FOREIGN KEY ("campaignRecipientId") REFERENCES "campaign_recipient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_event" ADD CONSTRAINT "delivery_event_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_event" ADD CONSTRAINT "delivery_event_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_event" ADD CONSTRAINT "delivery_event_campaignRecipientId_fkey" FOREIGN KEY ("campaignRecipientId") REFERENCES "campaign_recipient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outbox_event" ADD CONSTRAINT "outbox_event_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_ignored_network" ADD CONSTRAINT "organization_ignored_network_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_ignored_network" ADD CONSTRAINT "organization_ignored_network_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

