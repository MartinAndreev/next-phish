export type { MailSendingProfileView } from "./types";

export { MailProviderType } from "./providers/mail-provider.types";
export type {
  MailProviderCapabilities,
  MailAttachment,
  SendMailInput,
  SendTestMailInput,
  SendMailResult,
  ConnectionTestResult,
} from "./providers/mail-provider.types";
export type { MailProvider } from "./providers/mail-provider.interface";
export {
  SMTPProviderConfigSchema,
  SMTPProvider,
  parseHostPort,
  resolvePort,
} from "./providers/smtp";
export type { SMTPProviderConfig } from "./providers/smtp";
export {
  MicrosoftGraphProviderConfigSchema,
  MicrosoftGraphProvider,
} from "./providers/microsoft-graph";
export type {
  MicrosoftGraphProviderConfig,
  GraphTokenResponse,
  GraphEmailAddress,
  GraphMessageBody,
  GraphAttachment,
  GraphSendMailPayload,
} from "./providers/microsoft-graph";
export {
  GeneralApiProviderConfigSchema,
  GeneralApiProvider,
} from "./providers/general-api";
export type { GeneralApiProviderConfig } from "./providers/general-api";
export { SendGridProviderConfigSchema } from "./providers/sendgrid";
export type { SendGridProviderConfig } from "./providers/sendgrid";
export { MailgunProviderConfigSchema } from "./providers/mailgun";
export type { MailgunProviderConfig } from "./providers/mailgun";
export { PostmarkProviderConfigSchema } from "./providers/postmark";
export type { PostmarkProviderConfig } from "./providers/postmark";
export { ResendProviderConfigSchema } from "./providers/resend";
export type { ResendProviderConfig } from "./providers/resend";
export { AwsSesProviderConfigSchema } from "./providers/aws-ses";
export type { AwsSesProviderConfig } from "./providers/aws-ses";

export {
  MailSendingProfileRepository,
  MailSendingProfileService,
  MailDispatcherService,
  MailProfileCacheService,
  MailProviderRegistry,
  CreateMailSendingProfileCommand,
  UpdateMailSendingProfileCommand,
  DeleteMailSendingProfileCommand,
  SendTestEmailCommand,
  VerifyConnectionCommand,
  GetMailSendingProfilesQuery,
  GetMailSendingProfileByIdQuery,
  registerMailSendingServices,
} from "./mail-sending-service.provider";

export {
  mailProviderTypeSchema,
  GetMailSendingProfilesSchema,
  GetMailSendingProfileByIdSchema,
  CreateMailSendingProfileSchema,
  UpdateMailSendingProfileSchema,
  DeleteMailSendingProfileSchema,
  SendTestEmailSchema,
  VerifyConnectionSchema,
} from "./validations";
export type {
  GetMailSendingProfilesInput,
  GetMailSendingProfileByIdInput,
  CreateMailSendingProfileInput,
  UpdateMailSendingProfileInput,
  DeleteMailSendingProfileInput,
  SendTestEmailInput,
  VerifyConnectionInput,
} from "./validations";

export type {
  CreateMailSendingProfileData,
  UpdateMailSendingProfileData,
  DeleteMailSendingProfileData,
  SendTestEmailData,
  VerifyConnectionData,
} from "./commands";
