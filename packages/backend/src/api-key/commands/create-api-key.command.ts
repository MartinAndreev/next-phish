import type { ICommandHandler } from "../../message-bus";
import type { OrganizationRepository } from "../../organization/repositories";

interface AuthApi {
  createApiKey: (opts: { body: Record<string, unknown> }) => Promise<unknown>;
}

export interface CreateApiKeyData {
  userId: string;
  name?: string;
  organizationIds?: string[];
  expiresIn?: number;
  permissions?: Record<string, string[]>;
  metadata?: Record<string, unknown>;
  rateLimitEnabled?: boolean;
  rateLimitMax?: number;
  rateLimitTimeWindow?: number;
}

export class CreateApiKeyCommand implements ICommandHandler<
  CreateApiKeyData,
  unknown
> {
  constructor(
    private readonly auth: AuthApi,
    private readonly orgRepo: OrganizationRepository,
  ) {}

  async execute(data: CreateApiKeyData): Promise<unknown> {
    if (data.organizationIds && data.organizationIds.length > 0) {
      const count = await this.orgRepo.countByUserIdAndOrgIds(
        data.userId,
        data.organizationIds,
      );

      if (count !== data.organizationIds.length) {
        throw new Error(
          "One or more organizations are invalid or you are not a member",
        );
      }
    }

    const metadata: Record<string, unknown> = {};
    if (data.organizationIds && data.organizationIds.length > 0) {
      metadata.organizations = data.organizationIds;
    }

    return this.auth.createApiKey({
      body: {
        name: data.name,
        expiresIn: data.expiresIn,
        permissions: data.permissions,
        userId: data.userId,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        rateLimitEnabled: data.rateLimitEnabled,
        rateLimitMax: data.rateLimitMax,
        rateLimitTimeWindow: data.rateLimitTimeWindow,
      },
    });
  }
}
