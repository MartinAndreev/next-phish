import { Container } from "typedi";
import type {
  IEmailService,
  IEmailProvider,
  SendEmailOptions,
} from "./email-service.interface";
import {
  EmailProviderType,
  emailProviderToken,
} from "./email-service.interface";

export class EmailService implements IEmailService {
  getProvider(type: EmailProviderType): IEmailProvider {
    return Container.get<IEmailProvider>(emailProviderToken(type));
  }

  getDefaultProvider(): IEmailProvider {
    const type =
      (process.env.EMAIL_PROVIDER as EmailProviderType) ??
      EmailProviderType.NODEMAILER;
    return this.getProvider(type);
  }

  async send(options: SendEmailOptions): Promise<void> {
    await this.getDefaultProvider().send(options);
  }
}
