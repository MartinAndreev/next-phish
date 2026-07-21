import { MailProviderType } from "../mail-provider.types";
import type {
  ConnectionTestResult,
  MailProviderCapabilities,
  SendMailInput,
  SendMailResult,
} from "../mail-provider.types";
import { BaseMailProvider } from "../base-mail-provider";
import {
  GeneralApiProviderConfigSchema,
  type GeneralApiProviderConfig,
} from "./general-api.config";

const GENERAL_API_CAPABILITIES: MailProviderCapabilities = {
  serverToServer: true,
  supportsHtml: true,
  supportsText: true,
  supportsAttachments: true,
  supportsCustomHeaders: false,
  supportsReplyTo: false,
  supportsTemplates: false,
  supportsBatch: false,
  supportsTracking: false,
  supportsRateLimitInfo: false,
  supportsIdempotencyKey: true,
};

interface GeneralApiRequestBody {
  from: { name: string; email: string };
  to: Array<{ email: string }>;
  cc?: Array<{ email: string }>;
  bcc?: Array<{ email: string }>;
  subject: string;
  html?: string;
  text?: string;
  message_id?: string;
  idempotency_key?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    content_type?: string;
  }>;
}

export class GeneralApiProvider extends BaseMailProvider<GeneralApiProviderConfig> {
  readonly type = MailProviderType.GENERAL_API;
  readonly capabilities = GENERAL_API_CAPABILITIES;
  readonly configSchema = GeneralApiProviderConfigSchema;
  readonly sensitiveFields = ["apiKey"] as const;

  async validateConfig(config: unknown): Promise<GeneralApiProviderConfig> {
    return GeneralApiProviderConfigSchema.parseAsync(config);
  }

  async verifyConnection(
    config: GeneralApiProviderConfig,
  ): Promise<ConnectionTestResult> {
    try {
      const start = Date.now();
      const headers = this.buildHeaders(config);
      const response = await fetch(config.sendEndpoint, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ping: true }),
      });
      const latencyMs = Date.now() - start;

      return {
        success: response.ok || response.status < 500,
        latencyMs,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "API connection failed";
      return { success: false, errorMessage: message };
    }
  }

  async send(
    config: GeneralApiProviderConfig,
    message: SendMailInput,
  ): Promise<SendMailResult> {
    try {
      const headers = this.buildHeaders(config);
      const body = this.buildRequestBody(message);

      const response = await fetch(config.sendEndpoint, {
        method: "POST",
        headers: {
          ...headers,
          ...(message.idempotencyKey
            ? { "Idempotency-Key": message.idempotencyKey }
            : {}),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const rawResponse = await response.json().catch(() => response.text());

      if (!response.ok) {
        return {
          provider: MailProviderType.GENERAL_API,
          success: false,
          errorCode: `API_${response.status}`,
          errorMessage:
            typeof rawResponse === "string"
              ? rawResponse
              : JSON.stringify(rawResponse),
          rawResponse,
        };
      }

      return {
        provider: MailProviderType.GENERAL_API,
        success: true,
        providerMessageId:
          rawResponse && typeof rawResponse === "object"
            ? (((rawResponse as Record<string, unknown>).messageId as string) ??
              ((rawResponse as Record<string, unknown>).id as string))
            : undefined,
        rawResponse,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "API send failed";
      return {
        provider: MailProviderType.GENERAL_API,
        success: false,
        errorCode: "API_SEND_FAILED",
        errorMessage: message,
      };
    }
  }

  private buildHeaders(
    config: GeneralApiProviderConfig,
  ): Record<string, string> {
    if (config.authMethod === "bearer") {
      return { Authorization: `Bearer ${config.apiKey}` };
    }
    return { [config.authHeaderName!]: config.apiKey };
  }

  private buildRequestBody(message: SendMailInput): GeneralApiRequestBody {
    const body: GeneralApiRequestBody = {
      from: { name: message.fromName, email: message.fromEmail },
      to: message.to.map((email) => ({ email })),
      subject: message.subject,
      message_id: message.messageId,
      idempotency_key: message.idempotencyKey,
    };

    if (message.cc?.length) {
      body.cc = message.cc.map((email) => ({ email }));
    }
    if (message.bcc?.length) {
      body.bcc = message.bcc.map((email) => ({ email }));
    }
    if (message.html) {
      body.html = message.html;
    }
    if (message.text) {
      body.text = message.text;
    }
    if (message.attachments?.length) {
      body.attachments = message.attachments.map((att) => ({
        filename: att.filename,
        content:
          typeof att.content === "string"
            ? att.content
            : att.content.toString("base64"),
        content_type: att.contentType,
      }));
    }

    return body;
  }
}
