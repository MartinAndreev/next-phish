import { $Enums } from "@prisma/client";

export const MailProviderType = $Enums.MailProviderType;
export type MailProviderType = $Enums.MailProviderType;

export interface MailProviderCapabilities {
  serverToServer: boolean;
  supportsHtml: boolean;
  supportsText: boolean;
  supportsAttachments: boolean;
  supportsCustomHeaders: boolean;
  supportsReplyTo: boolean;
  supportsTemplates: boolean;
  supportsBatch: boolean;
  supportsTracking: boolean;
  supportsRateLimitInfo: boolean;
  supportsIdempotencyKey: boolean;
}

export interface MailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface SendMailInput {
  fromName: string;
  fromEmail: string;
  replyToEmail?: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: MailAttachment[];
  headers?: Record<string, string>;
  metadata?: Record<string, unknown>;
  /** Stable RFC 5322 identifier for one logical message. */
  messageId?: string;
  /** Stable provider idempotency key when the provider supports it. */
  idempotencyKey?: string;
}

export interface SendTestMailInput {
  toEmail: string;
}

export interface SendMailResult {
  provider: MailProviderType;
  success: boolean;
  providerMessageId?: string;
  accepted?: string[];
  rejected?: string[];
  rawResponse?: unknown;
  errorCode?: string;
  errorMessage?: string;
}

export interface ConnectionTestResult {
  success: boolean;
  latencyMs?: number;
  errorMessage?: string;
  details?: Record<string, unknown>;
}
