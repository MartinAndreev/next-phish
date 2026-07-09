import { describe, it, expect } from "vitest";
import { GeneralApiProvider } from "../../../src/mail-sending/providers/general-api/general-api.provider";
import { GeneralApiProviderConfigSchema } from "../../../src/mail-sending/providers/general-api/general-api.config";
import { MailProviderType } from "../../../src/mail-sending/providers/mail-provider.types";

describe("GeneralApiProvider", () => {
  const provider = new GeneralApiProvider();

  describe("config validation", () => {
    it("validates a bearer auth config", () => {
      const result = GeneralApiProviderConfigSchema.parse({
        apiKey: "test-key",
        sendEndpoint: "https://api.example.com/send",
        authMethod: "bearer",
      });
      expect(result.authMethod).toBe("bearer");
    });

    it("validates a header auth config with header name", () => {
      const result = GeneralApiProviderConfigSchema.parse({
        apiKey: "test-key",
        sendEndpoint: "https://api.example.com/send",
        authMethod: "header",
        authHeaderName: "X-API-Key",
      });
      expect(result.authHeaderName).toBe("X-API-Key");
    });

    it("rejects header auth without header name", () => {
      const result = GeneralApiProviderConfigSchema.safeParse({
        apiKey: "test-key",
        sendEndpoint: "https://api.example.com/send",
        authMethod: "header",
      });
      expect(result.success).toBe(false);
    });

    it("rejects non-URL endpoint", () => {
      const result = GeneralApiProviderConfigSchema.safeParse({
        apiKey: "test-key",
        sendEndpoint: "not-a-url",
        authMethod: "bearer",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty API key", () => {
      const result = GeneralApiProviderConfigSchema.safeParse({
        apiKey: "",
        sendEndpoint: "https://api.example.com/send",
        authMethod: "bearer",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("provider capabilities", () => {
    it("reports correct capabilities", () => {
      expect(provider.capabilities.serverToServer).toBe(true);
      expect(provider.capabilities.supportsHtml).toBe(true);
      expect(provider.capabilities.supportsText).toBe(true);
      expect(provider.capabilities.supportsAttachments).toBe(true);
      expect(provider.capabilities.supportsCustomHeaders).toBe(false);
      expect(provider.capabilities.supportsReplyTo).toBe(false);
      expect(provider.capabilities.supportsTemplates).toBe(false);
      expect(provider.capabilities.supportsBatch).toBe(false);
      expect(provider.capabilities.supportsTracking).toBe(false);
      expect(provider.capabilities.supportsRateLimitInfo).toBe(false);
    });
  });

  it("has apiKey as sensitive field", () => {
    expect(provider.sensitiveFields).toContain("apiKey");
  });

  it("has correct provider type", () => {
    expect(provider.type).toBe(MailProviderType.GENERAL_API);
  });
});
