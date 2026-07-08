import { MailSendingProfileRepository } from "../repositories";
import { MailProviderRegistry } from "../registry";
import { MailProfileCacheService } from "./mail-profile-cache.service";
import type {
  SendMailInput,
  SendMailResult,
  SendTestMailInput,
  ConnectionTestResult,
} from "../providers/mail-provider.types";

export class MailDispatcherService {
  constructor(
    private readonly profileRepo: MailSendingProfileRepository,
    private readonly registry: MailProviderRegistry,
    private readonly profileCache: MailProfileCacheService,
  ) {}

  async dispatch(
    profileId: string,
    organizationId: string,
    message: SendMailInput,
  ): Promise<SendMailResult> {
    const profile = await this.profileRepo.findById(profileId, organizationId);
    if (!profile) {
      return {
        provider: message as unknown as SendMailResult["provider"],
        success: false,
        errorCode: "PROFILE_NOT_FOUND",
        errorMessage: `Mail sending profile ${profileId} not found`,
      };
    }

    const provider = this.registry.get(profile.providerType);

    return this.profileCache.withCachedConfig(
      profileId,
      provider,
      () => this.profileRepo.getConfig(profileId, organizationId),
      (validConfig) => provider.send(validConfig, message),
    );
  }

  async sendTest(
    profileId: string,
    organizationId: string,
    input: SendTestMailInput,
  ): Promise<SendMailResult> {
    const profile = await this.profileRepo.findById(profileId, organizationId);
    if (!profile) {
      return {
        provider: input as unknown as SendMailResult["provider"],
        success: false,
        errorCode: "PROFILE_NOT_FOUND",
        errorMessage: `Mail sending profile ${profileId} not found`,
      };
    }

    const provider = this.registry.get(profile.providerType);

    return this.profileCache.withCachedConfig(
      profileId,
      provider,
      () => this.profileRepo.getConfig(profileId, organizationId),
      (validConfig) => provider.sendTest(validConfig, input),
    );
  }

  async verifyConnection(
    profileId: string,
    organizationId: string,
  ): Promise<ConnectionTestResult> {
    const profile = await this.profileRepo.findById(profileId, organizationId);
    if (!profile) {
      return {
        success: false,
        errorMessage: `Mail sending profile ${profileId} not found`,
      };
    }

    const provider = this.registry.get(profile.providerType);

    return this.profileCache.withCachedConfig(
      profileId,
      provider,
      () => this.profileRepo.getConfig(profileId, organizationId),
      (validConfig) => provider.verifyConnection(validConfig),
    );
  }
}
