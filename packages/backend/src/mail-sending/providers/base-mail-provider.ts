import type { z } from "zod";
import type { MailProvider } from "./mail-provider.interface";
import type {
  MailProviderType,
  MailProviderCapabilities,
  SendMailInput,
  SendMailResult,
  SendTestMailInput,
  ConnectionTestResult,
} from "./mail-provider.types";

export abstract class BaseMailProvider<
  TConfig = unknown,
> implements MailProvider<TConfig> {
  abstract readonly type: MailProviderType;
  abstract readonly capabilities: MailProviderCapabilities;
  abstract readonly configSchema: z.ZodType<TConfig>;
  abstract readonly sensitiveFields: readonly string[];

  abstract validateConfig(config: unknown): Promise<TConfig>;
  abstract verifyConnection(config: TConfig): Promise<ConnectionTestResult>;
  abstract send(
    config: TConfig,
    message: SendMailInput,
  ): Promise<SendMailResult>;

  async sendTest(
    config: TConfig,
    input: SendTestMailInput,
  ): Promise<SendMailResult> {
    return this.send(config, {
      fromName: "NextPhish Test",
      fromEmail: input.toEmail,
      to: [input.toEmail],
      subject: "NextPhish Test Email",
      html: "<p>This is a test email from NextPhish to verify the configuration.</p>",
      text: "This is a test email from NextPhish to verify the configuration.",
    });
  }
}
