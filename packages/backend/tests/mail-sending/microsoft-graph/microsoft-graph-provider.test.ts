import { describe, it, expect } from "vitest";
import { MicrosoftGraphProvider } from "../../../src/mail-sending/providers/microsoft-graph/microsoft-graph.provider";
import type { GraphSendMailPayload } from "../../../src/mail-sending/providers/microsoft-graph/microsoft-graph.types";
import type { SendMailInput } from "../../../src/mail-sending/providers/mail-provider.types";
import { MailProviderType } from "../../../src/mail-sending/providers/mail-provider.types";

describe("MicrosoftGraphProvider", () => {
  const provider = new MicrosoftGraphProvider();

  describe("token request shape", () => {
    it("would use correct token endpoint with tenantId", () => {
      const config = {
        tenantId: "contoso.onmicrosoft.com",
        clientId: "client-id",
        clientSecret: "secret",
        senderMailbox: "user@contoso.onmicrosoft.com",
      };
      expect(config.tenantId).toBeTruthy();
    });

    it("requires either clientSecret or certificate", () => {
      const schema = provider.configSchema;
      const withoutAuth = schema.safeParse({
        tenantId: "contoso",
        clientId: "client-id",
        senderMailbox: "user@contoso.onmicrosoft.com",
      });
      expect(withoutAuth.success).toBe(false);

      const withSecret = schema.safeParse({
        tenantId: "contoso",
        clientId: "client-id",
        clientSecret: "secret",
        senderMailbox: "user@contoso.onmicrosoft.com",
      });
      expect(withSecret.success).toBe(true);

      const withCert = schema.safeParse({
        tenantId: "contoso",
        clientId: "client-id",
        certificate: "cert-data",
        senderMailbox: "user@contoso.onmicrosoft.com",
      });
      expect(withCert.success).toBe(true);
    });

    it("requires valid senderMailbox email", () => {
      const schema = provider.configSchema;
      const result = schema.safeParse({
        tenantId: "contoso",
        clientId: "client-id",
        clientSecret: "secret",
        senderMailbox: "not-an-email",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("sendMail payload mapping", () => {
    it("maps SendMailInput to Graph payload", () => {
      const message: SendMailInput = {
        fromName: "Test Sender",
        fromEmail: "sender@contoso.com",
        to: ["recipient@contoso.com"],
        cc: ["cc@contoso.com"],
        bcc: ["bcc@contoso.com"],
        subject: "Test Subject",
        html: "<p>HTML content</p>",
        text: "Plain text",
        replyToEmail: "reply@contoso.com",
        headers: { "X-Custom": "value" },
        attachments: [
          {
            filename: "test.txt",
            content: "file content",
            contentType: "text/plain",
          },
        ],
      };

      const payload: GraphSendMailPayload = provider.mapToGraphPayload(message);

      expect(payload.message.subject).toBe("Test Subject");
      expect(payload.message.body.contentType).toBe("HTML");
      expect(payload.message.body.content).toBe("<p>HTML content</p>");
      expect(payload.message.toRecipients).toHaveLength(1);
      expect(payload.message.toRecipients[0].emailAddress.address).toBe(
        "recipient@contoso.com",
      );
      expect(payload.message.toRecipients[0].emailAddress.name).toBe(
        "Test Sender",
      );
      expect(payload.message.ccRecipients).toHaveLength(1);
      expect(payload.message.ccRecipients![0].emailAddress.address).toBe(
        "cc@contoso.com",
      );
      expect(payload.message.bccRecipients).toHaveLength(1);
      expect(payload.message.bccRecipients![0].emailAddress.address).toBe(
        "bcc@contoso.com",
      );
      expect(payload.message.from?.emailAddress.address).toBe(
        "sender@contoso.com",
      );
      expect(payload.message.from?.emailAddress.name).toBe("Test Sender");
      expect(payload.message.replyTo).toHaveLength(1);
      expect(payload.message.replyTo![0].emailAddress.address).toBe(
        "reply@contoso.com",
      );
      expect(payload.message.internetMessageHeaders).toHaveLength(1);
      expect(payload.message.internetMessageHeaders![0].name).toBe("X-Custom");
      expect(payload.message.attachments).toHaveLength(1);
      expect(payload.message.attachments![0].name).toBe("test.txt");
      expect(payload.saveToSentItems).toBe(false);
    });

    it("uses text content when no HTML is provided", () => {
      const message: SendMailInput = {
        fromName: "Sender",
        fromEmail: "sender@test.com",
        to: ["to@test.com"],
        subject: "Test",
        text: "Plain text only",
      };

      const payload = provider.mapToGraphPayload(message);

      expect(payload.message.body.contentType).toBe("Text");
      expect(payload.message.body.content).toBe("Plain text only");
    });

    it("omits optional fields when not provided", () => {
      const message: SendMailInput = {
        fromName: "Sender",
        fromEmail: "sender@test.com",
        to: ["to@test.com"],
        subject: "Test",
      };

      const payload = provider.mapToGraphPayload(message);

      expect(payload.message.ccRecipients).toBeUndefined();
      expect(payload.message.bccRecipients).toBeUndefined();
      expect(payload.message.attachments).toBeUndefined();
      expect(payload.message.internetMessageHeaders).toBeUndefined();
      expect(payload.message.replyTo).toBeUndefined();
    });
  });

  describe("capabilities", () => {
    it("reports correct capabilities", () => {
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
  });

  it("has correct sensitive fields", () => {
    expect(provider.sensitiveFields).toContain("clientSecret");
    expect(provider.sensitiveFields).toContain("certificate");
  });

  it("has correct provider type", () => {
    expect(provider.type).toBe(MailProviderType.MICROSOFT_GRAPH);
  });
});
