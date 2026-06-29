import type { ICommandHandler } from "../../message-bus";
import type { ApiKeyService } from "../services";

export interface RevokeOrgApiKeysData {
  userId: string;
  organizationId: string;
}

export class RevokeOrgApiKeysCommand implements ICommandHandler<
  RevokeOrgApiKeysData,
  void
> {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  async execute(data: RevokeOrgApiKeysData): Promise<void> {
    await this.apiKeyService.revokeOrgAccess(data.userId, data.organizationId);
  }
}
