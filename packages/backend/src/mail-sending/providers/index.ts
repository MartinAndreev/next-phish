export { MailProviderType } from "./mail-provider.types";
export type {
  MailProviderCapabilities,
  MailAttachment,
  SendMailInput,
  SendTestMailInput,
  SendMailResult,
  ConnectionTestResult,
} from "./mail-provider.types";
export type { MailProvider } from "./mail-provider.interface";
export { BaseMailProvider } from "./base-mail-provider";
export {
  SMTPProviderConfigSchema,
  SMTPProvider,
  parseHostPort,
  resolvePort,
} from "./smtp";
export type { SMTPProviderConfig } from "./smtp";
export {
  MicrosoftGraphProviderConfigSchema,
  MicrosoftGraphProvider,
} from "./microsoft-graph";
export type {
  MicrosoftGraphProviderConfig,
  GraphTokenResponse,
  GraphEmailAddress,
  GraphMessageBody,
  GraphAttachment,
  GraphSendMailPayload,
} from "./microsoft-graph";
export {
  GeneralApiProviderConfigSchema,
  GeneralApiProvider,
} from "./general-api";
export type { GeneralApiProviderConfig } from "./general-api";
export { SendGridProviderConfigSchema } from "./sendgrid";
export type { SendGridProviderConfig } from "./sendgrid";
export { MailgunProviderConfigSchema } from "./mailgun";
export type { MailgunProviderConfig } from "./mailgun";
export { PostmarkProviderConfigSchema } from "./postmark";
export type { PostmarkProviderConfig } from "./postmark";
export { ResendProviderConfigSchema } from "./resend";
export type { ResendProviderConfig } from "./resend";
export { AwsSesProviderConfigSchema } from "./aws-ses";
export type { AwsSesProviderConfig } from "./aws-ses";
