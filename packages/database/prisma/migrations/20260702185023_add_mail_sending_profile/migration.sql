-- CreateEnum
CREATE TYPE "MailProviderType" AS ENUM ('SMTP', 'MICROSOFT_GRAPH', 'AWS_SES', 'SENDGRID', 'MAILGUN', 'POSTMARK', 'RESEND', 'GENERAL_API');

-- CreateTable
CREATE TABLE "mail_sending_profile" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "providerType" "MailProviderType" NOT NULL,
    "fromName" TEXT NOT NULL,
    "fromEmail" TEXT NOT NULL,
    "replyToEmail" TEXT,
    "headers" JSONB DEFAULT '{}',
    "providerConfig" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mail_sending_profile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mail_sending_profile_organizationId_idx" ON "mail_sending_profile"("organizationId");

-- CreateIndex
CREATE INDEX "mail_sending_profile_providerType_idx" ON "mail_sending_profile"("providerType");

-- AddForeignKey
ALTER TABLE "mail_sending_profile" ADD CONSTRAINT "mail_sending_profile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
