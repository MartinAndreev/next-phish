import { Container } from "typedi";
import type { PrismaClient } from "@next-phish/database";
import { OrganizationRepository } from "../organization/repositories";
import { ApiKeyService } from "./services";
import { CreateApiKeyCommand, RevokeOrgApiKeysCommand } from "./commands";

interface AuthApi {
  createApiKey: (opts: { body: Record<string, unknown> }) => Promise<unknown>;
}

export function registerApiKeyServices(db: PrismaClient): void {
  const apiKeyService = new ApiKeyService(db);

  Container.set(ApiKeyService, apiKeyService);
  Container.set(
    RevokeOrgApiKeysCommand,
    new RevokeOrgApiKeysCommand(apiKeyService),
  );
}

export function registerApiKeyAuth(auth: { api: AuthApi }): void {
  const orgRepo = Container.get(OrganizationRepository);
  Container.set(
    CreateApiKeyCommand,
    new CreateApiKeyCommand(auth.api, orgRepo),
  );
}
