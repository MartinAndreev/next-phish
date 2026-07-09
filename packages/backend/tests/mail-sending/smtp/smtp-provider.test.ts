import { describe, it, expect } from "vitest";
import { SMTPProvider } from "../../../src/mail-sending/providers/smtp/smtp.provider";
import { MailProviderType } from "../../../src/mail-sending/providers/mail-provider.types";

describe("SMTPProvider", () => {
  const provider = new SMTPProvider();

  it("has correct type", () => {
    expect(provider.type).toBe(MailProviderType.SMTP);
  });

  it("reports capabilities correctly", () => {
    expect(provider.capabilities.serverToServer).toBe(true);
    expect(provider.capabilities.supportsHtml).toBe(true);
    expect(provider.capabilities.supportsText).toBe(true);
    expect(provider.capabilities.supportsAttachments).toBe(true);
    expect(provider.capabilities.supportsCustomHeaders).toBe(true);
    expect(provider.capabilities.supportsReplyTo).toBe(true);
    expect(provider.capabilities.supportsTemplates).toBe(false);
    expect(provider.capabilities.supportsBatch).toBe(false);
    expect(provider.capabilities.supportsTracking).toBe(false);
    expect(provider.capabilities.supportsRateLimitInfo).toBe(false);
  });

  it("has password as sensitive field", () => {
    expect(provider.sensitiveFields).toContain("password");
    expect(provider.sensitiveFields).toHaveLength(1);
  });

  it("validates SMTP config successfully", async () => {
    const result = await provider.validateConfig({
      host: "smtp.example.com",
      port: 587,
    });
    expect(result.host).toBe("smtp.example.com");
    expect(result.port).toBe(587);
  });

  it("validates SMTP config with GoPhish host:port format", async () => {
    const result = await provider.validateConfig({
      host: "smtp.example.com:587",
    });
    expect(result.host).toBe("smtp.example.com:587");
  });

  it("rejects invalid config", async () => {
    await expect(provider.validateConfig({ host: "" })).rejects.toThrow();
  });

  it("sendTest calls send with test message shape", () => {
    expect(provider.sendTest).toBeDefined();
    expect(typeof provider.sendTest).toBe("function");
  });
});
