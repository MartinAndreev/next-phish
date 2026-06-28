/*
  Warnings:

  - You are about to drop the column `path` on the `page` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "page_path_key";

-- AlterTable
ALTER TABLE "page" DROP COLUMN "path";
