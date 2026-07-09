import { describe, it, expect } from "vitest";
import { MailProviderRegistry } from "../../../src/mail-sending/registry/mail-provider-registry";
import { SMTPProvider } from "../../../src/mail-sending/providers/smtp/smtp.provider";
import { MicrosoftGraphProvider } from "../../../src/mail-sending/providers/microsoft-graph/microsoft-graph.provider";
import { GeneralApiProvider } from "../../../src/mail-sending/providers/general-api/general-api.provider";
import { MailProviderType } from "../../../src/mail-sending/providers/mail-provider.types";
import type { MailProvider } from "../../../src/mail-sending/providers/mail-provider.interface";

describe("MailProviderRegistry", () => {
  let registry: MailProviderRegistry;

  beforeEach(() => {
    registry = new MailProviderRegistry();
  });

  it("registers and retrieves a provider", () => {
    const smtp = new SMTPProvider();
    registry.register(smtp);

    const retrieved = registry.get(MailProviderType.SMTP);
    expect(retrieved).toBe(smtp);
  });

  it("throws when getting unregistered provider", () => {
    expect(() => registry.get(MailProviderType.SMTP)).toThrow(
      'No mail provider registered for type "SMTP"',
    );
  });

  it("throws when registering duplicate provider type", () => {
    registry.register(new SMTPProvider());
    expect(() => registry.register(new SMTPProvider())).toThrow(
      'Mail provider for type "SMTP" is already registered',
    );
  });

  it("lists all registered providers", () => {
    registry.register(new SMTPProvider());
    registry.register(new MicrosoftGraphProvider());
    registry.register(new GeneralApiProvider());

    const list = registry.list();
    expect(list).toHaveLength(3);
  });

  it("has returns false for unregistered type", () => {
    expect(registry.has(MailProviderType.SMTP)).toBe(false);
    registry.register(new SMTPProvider());
    expect(registry.has(MailProviderType.SMTP)).toBe(true);
    expect(registry.has(MailProviderType.MICROSOFT_GRAPH)).toBe(false);
  });

  it("listCapabilities returns capabilities for all providers", () => {
    registry.register(new SMTPProvider());
    registry.register(new MicrosoftGraphProvider());

    const capabilities = registry.listCapabilities();
    expect(capabilities).toHaveLength(2);
    expect(capabilities[0].type).toBe(MailProviderType.SMTP);
    expect(capabilities[0].capabilities.serverToServer).toBe(true);
    expect(capabilities[1].type).toBe(MailProviderType.MICROSOFT_GRAPH);
  });

  it("each registered provider implements MailProvider interface", () => {
    const providers: MailProvider[] = [
      new SMTPProvider(),
      new MicrosoftGraphProvider(),
      new GeneralApiProvider(),
    ];

    for (const provider of providers) {
      registry.register(provider);
      expect(typeof provider.type).toBe("string");
      expect(typeof provider.capabilities).toBe("object");
      expect(typeof provider.configSchema).toBe("object");
      expect(Array.isArray(provider.sensitiveFields)).toBe(true);
      expect(typeof provider.validateConfig).toBe("function");
      expect(typeof provider.verifyConnection).toBe("function");
      expect(typeof provider.send).toBe("function");
      expect(typeof provider.sendTest).toBe("function");
    }
  });
});
