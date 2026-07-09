import type { z } from "zod";
import type {
  ConnectionTestResult,
  MailProviderCapabilities,
  MailProviderType,
  SendMailInput,
  SendMailResult,
  SendTestMailInput,
} from "./mail-provider.types";

export interface MailProvider<TConfig = unknown> {
  readonly type: MailProviderType;
  readonly capabilities: MailProviderCapabilities;
  readonly configSchema: z.ZodType<TConfig>;
  readonly sensitiveFields: readonly string[];

  validateConfig(config: unknown): Promise<TConfig>;
  verifyConnection(config: TConfig): Promise<ConnectionTestResult>;
  send(config: TConfig, message: SendMailInput): Promise<SendMailResult>;
  sendTest(config: TConfig, input: SendTestMailInput): Promise<SendMailResult>;
}
