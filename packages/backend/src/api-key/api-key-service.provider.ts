import { Container } from "typedi";
import type { PrismaClient } from "@next-phish/database";
import { ApiKeyService } from "./services";
import { RevokeOrgApiKeysCommand } from "./commands";

export function registerApiKeyServices(db: PrismaClient): void {
  const apiKeyService = new ApiKeyService(db);

  Container.set(ApiKeyService, apiKeyService);
  Container.set(
    RevokeOrgApiKeysCommand,
    new RevokeOrgApiKeysCommand(apiKeyService),
  );
}
