import { CacheService } from "../../cache";
import type { EncryptedPayload, EncryptionService } from "../../encryption";
import type { MailProvider } from "../providers/mail-provider.interface";

export class MailProfileCacheService {
  constructor(
    private readonly cache: CacheService,
    private readonly encryption: EncryptionService,
  ) {}

  async withCachedConfig<TConfig, TResult>(
    profileId: string,
    provider: MailProvider<TConfig>,
    loader: () => Promise<Record<string, unknown>>,
    callback: (validConfig: TConfig) => Promise<TResult>,
  ): Promise<TResult> {
    const key = `mail:profile:${profileId}`;

    const encryptedConfig = await this.cache.withCallback(
      key,
      async () => {
        const raw = await loader();
        const decrypted = this.decryptSensitiveFields(raw, provider);
        provider.configSchema.parse(decrypted);
        return raw;
      },
      300,
    );

    const decrypted = this.decryptSensitiveFields(encryptedConfig, provider);
    return callback(decrypted as TConfig);
  }

  async invalidate(profileId: string): Promise<void> {
    await this.cache.del(`mail:profile:${profileId}`);
  }

  decryptSensitiveFields(
    config: Record<string, unknown>,
    provider: MailProvider,
  ): Record<string, unknown> {
    const result = { ...config };
    for (const field of provider.sensitiveFields) {
      const value = result[field];
      if (value && typeof value === "object" && !Array.isArray(value)) {
        result[field] = this.encryption.decryptSecret(
          value as EncryptedPayload,
        );
      }
    }
    return result;
  }

  encryptSensitiveFields(
    config: Record<string, unknown>,
    provider: MailProvider,
  ): Record<string, unknown> {
    const result = { ...config };
    for (const field of provider.sensitiveFields) {
      const value = result[field];
      if (value && typeof value === "string") {
        result[field] = this.encryption.encryptSecret(value);
      }
    }
    return result;
  }
}
