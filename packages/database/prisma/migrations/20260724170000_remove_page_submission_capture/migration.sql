ALTER TABLE "page_submission"
DROP CONSTRAINT "page_submission_pageId_fkey";

ALTER TABLE "page" DROP COLUMN "captureData";
DROP TABLE "page_submission";
