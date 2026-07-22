ALTER TABLE "organization"
ADD COLUMN "deliveryEnabled" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "campaign"
ADD COLUMN "deliveryEnabled" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "ignored_network_audit" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "ignoredNetworkId" TEXT,
    "action" TEXT NOT NULL,
    "normalizedNetwork" TEXT NOT NULL,
    "description" TEXT,
    "actorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ignored_network_audit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ignored_network_audit_organizationId_createdAt_idx"
ON "ignored_network_audit"("organizationId", "createdAt");

CREATE INDEX "ignored_network_audit_ignoredNetworkId_idx"
ON "ignored_network_audit"("ignoredNetworkId");

ALTER TABLE "ignored_network_audit"
ADD CONSTRAINT "ignored_network_audit_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "organization"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ignored_network_audit"
ADD CONSTRAINT "ignored_network_audit_actorId_fkey"
FOREIGN KEY ("actorId") REFERENCES "user"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
