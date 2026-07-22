CREATE INDEX "campaign_organizationId_createdAt_idx"
ON "campaign"("organizationId", "createdAt");

CREATE INDEX "campaign_event_organizationId_occurredAt_idx"
ON "campaign_event"("organizationId", "occurredAt");
