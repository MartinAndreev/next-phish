CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE "TaskStatusCategory" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');

CREATE TABLE "task_status" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "colorToken" TEXT NOT NULL DEFAULT 'neutral',
  "category" "TaskStatusCategory" NOT NULL,
  "position" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "task_status_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "task" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "statusId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "assigneeId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
  "dueAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "campaignId" TEXT,
  "scheduleId" TEXT,
  "pageId" TEXT,
  "emailTemplateId" TEXT,
  "targetGroupId" TEXT,
  "mailSendingProfileId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "task_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "task_one_related_resource" CHECK (num_nonnulls("campaignId", "scheduleId", "pageId", "emailTemplateId", "targetGroupId", "mailSendingProfileId") <= 1)
);

CREATE UNIQUE INDEX "task_status_organizationId_normalizedName_key" ON "task_status"("organizationId", "normalizedName");
CREATE UNIQUE INDEX "task_status_organizationId_position_key" ON "task_status"("organizationId", "position");
CREATE UNIQUE INDEX "task_status_id_organizationId_key" ON "task_status"("id", "organizationId");
CREATE INDEX "task_status_organizationId_category_idx" ON "task_status"("organizationId", "category");
CREATE INDEX "task_organizationId_statusId_updatedAt_idx" ON "task"("organizationId", "statusId", "updatedAt");
CREATE INDEX "task_organizationId_assigneeId_idx" ON "task"("organizationId", "assigneeId");
CREATE INDEX "task_organizationId_dueAt_idx" ON "task"("organizationId", "dueAt");

ALTER TABLE "task_status" ADD CONSTRAINT "task_status_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task" ADD CONSTRAINT "task_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task" ADD CONSTRAINT "task_statusId_organizationId_fkey" FOREIGN KEY ("statusId", "organizationId") REFERENCES "task_status"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "task" ADD CONSTRAINT "task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "task" ADD CONSTRAINT "task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "task" ADD CONSTRAINT "task_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "task" ADD CONSTRAINT "task_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "schedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "task" ADD CONSTRAINT "task_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "page"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "task" ADD CONSTRAINT "task_emailTemplateId_fkey" FOREIGN KEY ("emailTemplateId") REFERENCES "email_template"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "task" ADD CONSTRAINT "task_targetGroupId_fkey" FOREIGN KEY ("targetGroupId") REFERENCES "target_group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "task" ADD CONSTRAINT "task_mailSendingProfileId_fkey" FOREIGN KEY ("mailSendingProfileId") REFERENCES "mail_sending_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "task_status" ("id", "organizationId", "name", "normalizedName", "colorToken", "category", "position")
SELECT 'task-todo-' || "id", "id", 'Todo', 'todo', 'neutral', 'TODO', 0 FROM "organization";
INSERT INTO "task_status" ("id", "organizationId", "name", "normalizedName", "colorToken", "category", "position")
SELECT 'task-progress-' || "id", "id", 'In Progress', 'in progress', 'blue', 'IN_PROGRESS', 1 FROM "organization";
INSERT INTO "task_status" ("id", "organizationId", "name", "normalizedName", "colorToken", "category", "position")
SELECT 'task-done-' || "id", "id", 'Done', 'done', 'cyan', 'DONE', 2 FROM "organization";
