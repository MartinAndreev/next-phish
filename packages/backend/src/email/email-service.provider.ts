import { Container } from "typedi";
import {
  EmailProviderType,
  emailProviderToken,
  EMAIL_SERVICE_TOKEN,
} from "./email-service.interface";
import { EmailService } from "./email.service";
import { NodemailerProvider } from "./providers/nodemailer.provider";

export function registerEmailServices(): void {
  Container.set(
    emailProviderToken(EmailProviderType.NODEMAILER),
    new NodemailerProvider(),
  );

  Container.set(EMAIL_SERVICE_TOKEN, new EmailService());
}
