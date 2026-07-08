import { MailProviderRegistry } from "../registry";
import { MailProfileCacheService } from "./mail-profile-cache.service";
import type { MailProvider } from "../providers/mail-provider.interface";
import type {
  MailSendingProfileRepository,
  CreateMailSendingProfileData,
  UpdateMailSendingProfileData,
  MailSendingProfileRow,
} from "../repositories";

export interface MailSendingProfileView {
  id: string;
  organizationId: string;
  name: string;
  providerType: string;
  fromName: string;
  fromEmail: string;
  replyToEmail: string | null;
  headers: Record<string, unknown> | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  providerConfig: Record<string, unknown>;
}

export class MailSendingProfileService {
  constructor(
    private readonly repo: MailSendingProfileRepository,
    private readonly registry: MailProviderRegistry,
    private readonly cache: MailProfileCacheService,
  ) {}

  async create(
    data: CreateMailSendingProfileData,
  ): Promise<MailSendingProfileView> {
    const provider = this.registry.get(data.providerType);
    const validConfig = await provider.validateConfig(data.providerConfig);
    const encrypted = this.cache.encryptSensitiveFields(
      validConfig as Record<string, unknown>,
      provider,
    );

    const row = await this.repo.create({
      ...data,
      providerConfig: encrypted,
    });

    await this.cache.invalidate(row.id);

    return this.toView(row, provider);
  }

  async update(
    id: string,
    organizationId: string,
    data: UpdateMailSendingProfileData,
  ): Promise<MailSendingProfileView | null> {
    let provider: MailProvider | null = null;
    const updateData: Record<string, unknown> = { ...data };

    if (data.providerConfig) {
      const existing = await this.repo.findById(id, organizationId);
      if (!existing) return null;
      provider = this.registry.get(existing.providerType);
      const validConfig = await provider.validateConfig(data.providerConfig);
      const encrypted = this.cache.encryptSensitiveFields(
        validConfig as Record<string, unknown>,
        provider,
      );
      updateData.providerConfig = encrypted;
    }

    const row = await this.repo.update(
      id,
      organizationId,
      updateData as UpdateMailSendingProfileData,
    );
    if (!row) return null;

    await this.cache.invalidate(id);

    const resolvedProvider = provider ?? this.registry.get(row.providerType);
    return this.toView(row, resolvedProvider);
  }

  async delete(id: string, organizationId: string): Promise<boolean> {
    const result = await this.repo.delete(id, organizationId);
    if (result) {
      await this.cache.invalidate(id);
    }
    return result;
  }

  toListItemView(row: MailSendingProfileRow): MailSendingProfileView {
    return {
      id: row.id,
      organizationId: row.organizationId,
      name: row.name,
      providerType: row.providerType,
      fromName: row.fromName,
      fromEmail: row.fromEmail,
      replyToEmail: row.replyToEmail,
      headers: row.headers,
      isDefault: row.isDefault,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      providerConfig: { "[REDACTED]": true },
    };
  }

  toView(
    row: MailSendingProfileRow,
    provider: MailProvider,
  ): MailSendingProfileView {
    const decrypted = this.cache.decryptSensitiveFields(
      { ...row.providerConfig },
      provider,
    );

    return {
      id: row.id,
      organizationId: row.organizationId,
      name: row.name,
      providerType: row.providerType,
      fromName: row.fromName,
      fromEmail: row.fromEmail,
      replyToEmail: row.replyToEmail,
      headers: row.headers,
      isDefault: row.isDefault,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      providerConfig: this.redactConfig(decrypted, provider),
    };
  }

  private redactConfig(
    config: Record<string, unknown>,
    provider: MailProvider,
  ): Record<string, unknown> {
    const result = { ...config };
    for (const field of provider.sensitiveFields) {
      if (result[field] && typeof result[field] === "string") {
        result[field] = "[REDACTED]";
      }
    }
    return result;
  }
}
