export {
  EmailProviderType,
  emailProviderToken,
  EMAIL_SERVICE_TOKEN,
} from "./email-service.interface";
export type {
  IEmailService,
  IEmailProvider,
  SendEmailOptions,
} from "./email-service.interface";
export { EmailService } from "./email.service";
export { NodemailerProvider } from "./providers/nodemailer.provider";
export { registerEmailServices } from "./email-service.provider";
