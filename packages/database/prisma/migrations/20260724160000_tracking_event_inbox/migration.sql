CREATE TABLE "tracking_event_inbox" (
    "id" TEXT NOT NULL,
    "trackingRef" VARCHAR(12) NOT NULL,
    "type" "CampaignEventType" NOT NULL,
    "clientIp" TEXT NOT NULL,
    "deduplicationKey" TEXT NOT NULL,
    "occurredAt" TIMESTAMPTZ(3) NOT NULL,
    "processedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tracking_event_inbox_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tracking_event_inbox_deduplicationKey_key"
ON "tracking_event_inbox"("deduplicationKey");

CREATE INDEX "tracking_event_inbox_processedAt_createdAt_idx"
ON "tracking_event_inbox"("processedAt", "createdAt");
