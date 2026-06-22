-- AlterTable
ALTER TABLE "file" ADD COLUMN     "organizationId" TEXT;

-- CreateIndex
CREATE INDEX "file_organizationId_idx" ON "file"("organizationId");

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
