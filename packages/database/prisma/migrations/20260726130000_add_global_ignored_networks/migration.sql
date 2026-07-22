ALTER TABLE "organization_ignored_network" RENAME TO "ignored_network";

ALTER TABLE "ignored_network"
RENAME CONSTRAINT "organization_ignored_network_pkey" TO "ignored_network_pkey";
ALTER TABLE "ignored_network"
RENAME CONSTRAINT "organization_ignored_network_organizationId_fkey" TO "ignored_network_organizationId_fkey";
ALTER TABLE "ignored_network"
RENAME CONSTRAINT "organization_ignored_network_createdById_fkey" TO "ignored_network_createdById_fkey";

ALTER INDEX "organization_ignored_network_organizationId_idx"
RENAME TO "ignored_network_organizationId_idx";
ALTER INDEX "organization_ignored_network_organizationId_normalizedNetwo_key"
RENAME TO "ignored_network_organizationId_normalizedNetwork_key";

ALTER TABLE "ignored_network"
ALTER COLUMN "organizationId" DROP NOT NULL;

-- PostgreSQL treats NULL values as distinct in a regular unique constraint, so
-- global entries need a partial unique index of their own.
CREATE UNIQUE INDEX "ignored_network_global_normalizedNetwork_key"
ON "ignored_network"("normalizedNetwork")
WHERE "organizationId" IS NULL;
