ALTER TABLE "task_status" ADD COLUMN "marksTaskDone" BOOLEAN NOT NULL DEFAULT false;
UPDATE "task_status" SET "marksTaskDone" = true WHERE "category" = 'DONE';
DROP INDEX IF EXISTS "task_status_organizationId_category_idx";
ALTER TABLE "task_status" DROP COLUMN "category";
DROP TYPE "TaskStatusCategory";
