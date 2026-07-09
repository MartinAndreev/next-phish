import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { MailProviderType } from "../mail-provider.types";
import type {
  ConnectionTestResult,
  MailProviderCapabilities,
  SendMailInput,
  SendMailResult,
} from "../mail-provider.types";
import { BaseMailProvider } from "../base-mail-provider";
import {
  SMTPProviderConfigSchema,
  type SMTPProviderConfig,
} from "./smtp.config";
import { parseHostPort, resolvePort } from "./smtp.validation";

const SMTP_CAPABILITIES: MailProviderCapabilities = {
  serverToServer: true,
  supportsHtml: true,
  supportsText: true,
  supportsAttachments: true,
  supportsCustomHeaders: true,
  supportsReplyTo: true,
  supportsTemplates: false,
  supportsBatch: false,
  supportsTracking: false,
  supportsRateLimitInfo: false,
};

export class SMTPProvider extends BaseMailProvider<SMTPProviderConfig> {
  readonly type = MailProviderType.SMTP;
  readonly capabilities = SMTP_CAPABILITIES;
  readonly configSchema =
    SMTPProviderConfigSchema as import("zod").ZodType<SMTPProviderConfig>;
  readonly sensitiveFields = ["password"] as const;

  async validateConfig(config: unknown): Promise<SMTPProviderConfig> {
    return SMTPProviderConfigSchema.parseAsync(config);
  }

  async verifyConnection(
    config: SMTPProviderConfig,
  ): Promise<ConnectionTestResult> {
    const transporter = this.createTransporter(config);
    try {
      const start = Date.now();
      await transporter.verify();
      const latencyMs = Date.now() - start;
      return { success: true, latencyMs };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "SMTP connection failed";
      return { success: false, errorMessage: message };
    } finally {
      transporter.close();
    }
  }

  async send(
    config: SMTPProviderConfig,
    message: SendMailInput,
  ): Promise<SendMailResult> {
    const transporter = this.createTransporter(config);
    try {
      const result = await transporter.sendMail({
        from: this.formatAddress(message.fromName, message.fromEmail),
        replyTo: message.replyToEmail,
        to: message.to.join(", "),
        cc: message.cc?.join(", "),
        bcc: message.bcc?.join(", "),
        subject: message.subject,
        html: message.html,
        text: message.text,
        headers: message.headers,
        attachments: message.attachments?.map((att) => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType,
        })),
      });

      return {
        provider: MailProviderType.SMTP,
        success: true,
        providerMessageId: result.messageId,
        accepted: result.accepted as string[],
        rejected: result.rejected as string[],
        rawResponse: result.response,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "SMTP send failed";
      return {
        provider: MailProviderType.SMTP,
        success: false,
        errorCode: "SMTP_SEND_FAILED",
        errorMessage: message,
      };
    } finally {
      transporter.close();
    }
  }

  private createTransporter(config: SMTPProviderConfig): Transporter {
    const { host, port: extractedPort } = parseHostPort(config.host);
    const port = config.port ?? extractedPort ?? resolvePort(config);

    const tlsOptions: Record<string, unknown> = {};
    if (config.ignoreCertErrors) {
      tlsOptions.rejectUnauthorized = false;
    }
    if (config.requireTls) {
      tlsOptions.requireTls = true;
    }

    return nodemailer.createTransport({
      host,
      port,
      secure: config.secure,
      auth:
        config.username || config.password
          ? { user: config.username, pass: config.password }
          : undefined,
      ...(Object.keys(tlsOptions).length > 0 ? { tls: tlsOptions } : {}),
    });
  }

  private formatAddress(name: string, email: string): string {
    if (!name) return email;
    return `"${name.replace(/"/g, '\\"')}" <${email}>`;
  }
}
