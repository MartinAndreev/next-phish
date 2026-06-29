/*
  Warnings:

  - You are about to drop the `jwks` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `oauth_access_token` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `oauth_client` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `oauth_consent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `oauth_refresh_token` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "oauth_access_token" DROP CONSTRAINT "oauth_access_token_clientId_fkey";

-- DropForeignKey
ALTER TABLE "oauth_access_token" DROP CONSTRAINT "oauth_access_token_refreshId_fkey";

-- DropForeignKey
ALTER TABLE "oauth_access_token" DROP CONSTRAINT "oauth_access_token_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "oauth_access_token" DROP CONSTRAINT "oauth_access_token_userId_fkey";

-- DropForeignKey
ALTER TABLE "oauth_client" DROP CONSTRAINT "oauth_client_userId_fkey";

-- DropForeignKey
ALTER TABLE "oauth_consent" DROP CONSTRAINT "oauth_consent_clientId_fkey";

-- DropForeignKey
ALTER TABLE "oauth_consent" DROP CONSTRAINT "oauth_consent_userId_fkey";

-- DropForeignKey
ALTER TABLE "oauth_refresh_token" DROP CONSTRAINT "oauth_refresh_token_clientId_fkey";

-- DropForeignKey
ALTER TABLE "oauth_refresh_token" DROP CONSTRAINT "oauth_refresh_token_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "oauth_refresh_token" DROP CONSTRAINT "oauth_refresh_token_userId_fkey";

-- DropTable
DROP TABLE "jwks";

-- DropTable
DROP TABLE "oauth_access_token";

-- DropTable
DROP TABLE "oauth_client";

-- DropTable
DROP TABLE "oauth_consent";

-- DropTable
DROP TABLE "oauth_refresh_token";
