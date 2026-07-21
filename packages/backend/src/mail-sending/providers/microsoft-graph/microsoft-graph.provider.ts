import { MailProviderType } from "../mail-provider.types";
import type {
  ConnectionTestResult,
  MailProviderCapabilities,
  SendMailInput,
  SendMailResult,
  SendTestMailInput,
} from "../mail-provider.types";
import { BaseMailProvider } from "../base-mail-provider";
import {
  MicrosoftGraphProviderConfigSchema,
  type MicrosoftGraphProviderConfig,
} from "./microsoft-graph.config";
import type {
  GraphEmailAddress,
  GraphSendMailPayload,
  GraphTokenResponse,
} from "./microsoft-graph.types";

const GRAPH_CAPABILITIES: MailProviderCapabilities = {
  serverToServer: true,
  supportsHtml: true,
  supportsText: true,
  supportsAttachments: true,
  supportsCustomHeaders: false,
  supportsReplyTo: false,
  supportsTemplates: false,
  supportsBatch: true,
  supportsTracking: false,
  supportsRateLimitInfo: false,
  supportsIdempotencyKey: false,
};

const TOKEN_ENDPOINT = "https://login.microsoftonline.com";
const GRAPH_BASE = "https://graph.microsoft.com/v1.0";
const SCOPE = "https://graph.microsoft.com/.default";

export class MicrosoftGraphProvider extends BaseMailProvider<MicrosoftGraphProviderConfig> {
  readonly type = MailProviderType.MICROSOFT_GRAPH;
  readonly capabilities = GRAPH_CAPABILITIES;
  readonly configSchema = MicrosoftGraphProviderConfigSchema;
  readonly sensitiveFields = ["clientSecret", "certificate"] as const;

  async validateConfig(config: unknown): Promise<MicrosoftGraphProviderConfig> {
    return MicrosoftGraphProviderConfigSchema.parseAsync(config);
  }

  async verifyConnection(
    config: MicrosoftGraphProviderConfig,
  ): Promise<ConnectionTestResult> {
    try {
      const start = Date.now();
      await this.acquireToken(config);
      const latencyMs = Date.now() - start;
      return { success: true, latencyMs };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Microsoft Graph connection failed";
      return { success: false, errorMessage: message };
    }
  }

  async send(
    config: MicrosoftGraphProviderConfig,
    message: SendMailInput,
  ): Promise<SendMailResult> {
    try {
      const token = await this.acquireToken(config);
      const payload = this.mapToGraphPayload(message);

      const response = await fetch(
        `${GRAPH_BASE}/users/${config.senderMailbox}/sendMail`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const errorBody = await response.text();
        return {
          provider: MailProviderType.MICROSOFT_GRAPH,
          success: false,
          errorCode: `GRAPH_${response.status}`,
          errorMessage: errorBody,
          rawResponse: errorBody,
        };
      }

      return {
        provider: MailProviderType.MICROSOFT_GRAPH,
        success: true,
        providerMessageId: undefined,
        accepted: [config.senderMailbox],
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Microsoft Graph send failed";
      return {
        provider: MailProviderType.MICROSOFT_GRAPH,
        success: false,
        errorCode: "GRAPH_SEND_FAILED",
        errorMessage: message,
      };
    }
  }

  async sendTest(
    config: MicrosoftGraphProviderConfig,
    input: SendTestMailInput,
  ): Promise<SendMailResult> {
    return this.send(config, {
      fromName: "NextPhish Test",
      fromEmail: config.senderMailbox,
      to: [input.toEmail],
      subject: "NextPhish Microsoft 365 Test",
      html: "<p>This is a test email from NextPhish to verify Microsoft 365 configuration via Microsoft Graph.</p>",
      text: "This is a test email from NextPhish to verify Microsoft 365 configuration via Microsoft Graph.",
    });
  }

  private async acquireToken(
    config: MicrosoftGraphProviderConfig,
  ): Promise<string> {
    const formData = new URLSearchParams();
    formData.append("grant_type", "client_credentials");
    formData.append("scope", SCOPE);
    formData.append("client_id", config.clientId);

    if (config.clientSecret) {
      formData.append("client_secret", config.clientSecret);
    } else if (config.certificate) {
      formData.append(
        "client_assertion_type",
        "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      );
      formData.append("client_assertion", config.certificate);
    }

    const response = await fetch(
      `${TOKEN_ENDPOINT}/${config.tenantId}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Failed to acquire Microsoft Graph token: ${response.status} ${errorBody}`,
      );
    }

    const data = (await response.json()) as GraphTokenResponse;
    return data.access_token;
  }

  mapToGraphPayload(message: SendMailInput): GraphSendMailPayload {
    const toRecipients = this.mapRecipients(message.to, message.fromName);
    const ccRecipients = message.cc?.length
      ? this.mapRecipients(message.cc)
      : undefined;
    const bccRecipients = message.bcc?.length
      ? this.mapRecipients(message.bcc)
      : undefined;

    const hasHtml = !!message.html;
    const body = {
      contentType: hasHtml ? ("HTML" as const) : ("Text" as const),
      content: hasHtml ? (message.html ?? "") : (message.text ?? ""),
    };

    const attachments = message.attachments?.map((att) => ({
      "@odata.type": "#microsoft.graph.fileAttachment",
      name: att.filename,
      contentBytes:
        typeof att.content === "string"
          ? att.content
          : att.content.toString("base64"),
      contentType: att.contentType,
    }));

    const internetMessageHeaders = message.headers
      ? Object.entries(message.headers).map(([name, value]) => ({
          name,
          value,
        }))
      : undefined;

    const replyTo = message.replyToEmail
      ? [{ emailAddress: { address: message.replyToEmail } }]
      : undefined;

    return {
      message: {
        subject: message.subject,
        body,
        toRecipients,
        ccRecipients,
        bccRecipients,
        from: {
          emailAddress: {
            address: message.fromEmail,
            name: message.fromName,
          },
        },
        replyTo,
        attachments,
        internetMessageHeaders,
      },
      saveToSentItems: false,
    };
  }

  private mapRecipients(
    emails: string[],
    defaultName?: string,
  ): GraphEmailAddress[] {
    return emails.map((email) => ({
      emailAddress: {
        address: email,
        name: defaultName,
      },
    }));
  }
}
