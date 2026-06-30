-- CreateEnum
CREATE TYPE "TargetGroupStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "target_group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "TargetGroupStatus" NOT NULL DEFAULT 'DRAFT',
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "target_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "target_group_user" (
    "id" TEXT NOT NULL,
    "targetGroupId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "position" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "target_group_user_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "target_group_organizationId_idx" ON "target_group"("organizationId");

-- CreateIndex
CREATE INDEX "target_group_createdById_idx" ON "target_group"("createdById");

-- CreateIndex
CREATE INDEX "target_group_status_idx" ON "target_group"("status");

-- CreateIndex
CREATE INDEX "target_group_user_targetGroupId_idx" ON "target_group_user"("targetGroupId");

-- CreateIndex
CREATE INDEX "target_group_user_email_idx" ON "target_group_user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "target_group_user_targetGroupId_email_key" ON "target_group_user"("targetGroupId", "email");

-- AddForeignKey
ALTER TABLE "target_group" ADD CONSTRAINT "target_group_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "target_group" ADD CONSTRAINT "target_group_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "target_group_user" ADD CONSTRAINT "target_group_user_targetGroupId_fkey" FOREIGN KEY ("targetGroupId") REFERENCES "target_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
