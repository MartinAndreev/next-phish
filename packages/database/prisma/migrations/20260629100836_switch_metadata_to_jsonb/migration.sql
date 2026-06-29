/*
  Warnings:

  - The `metadata` column on the `api_key` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "api_key" DROP COLUMN "metadata",
ADD COLUMN     "metadata" JSONB;
