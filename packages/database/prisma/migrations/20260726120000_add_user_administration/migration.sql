ALTER TABLE "user"
ADD COLUMN "passwordSetupRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "disabledAt" TIMESTAMP(3);

CREATE INDEX "user_disabledAt_idx" ON "user"("disabledAt");
