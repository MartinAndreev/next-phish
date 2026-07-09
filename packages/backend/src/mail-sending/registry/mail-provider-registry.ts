import { MailProviderType } from "../providers/mail-provider.types";
import type { MailProviderCapabilities } from "../providers/mail-provider.types";
import type { MailProvider } from "../providers/mail-provider.interface";

export class MailProviderRegistry {
  private providers = new Map<MailProviderType, MailProvider>();

  register(provider: MailProvider): void {
    if (this.providers.has(provider.type)) {
      throw new Error(
        `Mail provider for type "${provider.type}" is already registered`,
      );
    }
    this.providers.set(provider.type, provider);
  }

  get(type: MailProviderType): MailProvider {
    const provider = this.providers.get(type);
    if (!provider) {
      throw new Error(`No mail provider registered for type "${type}"`);
    }
    return provider;
  }

  has(type: MailProviderType): boolean {
    return this.providers.has(type);
  }

  list(): MailProvider[] {
    return Array.from(this.providers.values());
  }

  listCapabilities(): Array<{
    type: MailProviderType;
    capabilities: MailProviderCapabilities;
  }> {
    return this.list().map((provider) => ({
      type: provider.type,
      capabilities: provider.capabilities,
    }));
  }
}
