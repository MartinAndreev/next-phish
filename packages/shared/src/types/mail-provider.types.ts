export const MAIL_PROVIDER_TYPES = [
  "SMTP",
  "MICROSOFT_GRAPH",
  "AWS_SES",
  "SENDGRID",
  "MAILGUN",
  "POSTMARK",
  "RESEND",
  "GENERAL_API",
] as const;

export type MailProviderType = (typeof MAIL_PROVIDER_TYPES)[number];
