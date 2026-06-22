-- CreateEnum
CREATE TYPE "FilePurpose" AS ENUM ('EMAIL_ATTACHMENT', 'IMPORT', 'EXPORT');

-- AlterTable
ALTER TABLE "email_template" ADD COLUMN     "trackingPixel" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "file" (
    "id" TEXT NOT NULL,
    "remoteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "format" TEXT NOT NULL,
    "purpose" "FilePurpose" NOT NULL DEFAULT 'EMAIL_ATTACHMENT',
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "file_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_template_file" (
    "id" TEXT NOT NULL,
    "emailTemplateId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_template_file_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "file_uploadedById_idx" ON "file"("uploadedById");

-- CreateIndex
CREATE INDEX "file_purpose_idx" ON "file"("purpose");

-- CreateIndex
CREATE UNIQUE INDEX "email_template_file_emailTemplateId_fileId_key" ON "email_template_file"("emailTemplateId", "fileId");

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_template_file" ADD CONSTRAINT "email_template_file_emailTemplateId_fkey" FOREIGN KEY ("emailTemplateId") REFERENCES "email_template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_template_file" ADD CONSTRAINT "email_template_file_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "file"("id") ON DELETE CASCADE ON UPDATE CASCADE;
