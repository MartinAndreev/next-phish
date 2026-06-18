export enum EmailProviderType {
  NODEMAILER = "nodemailer",
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export interface IEmailProvider {
  send(options: SendEmailOptions): Promise<void>;
}

export interface IEmailService {
  getProvider(type: EmailProviderType): IEmailProvider;
  getDefaultProvider(): IEmailProvider;
  send(options: SendEmailOptions): Promise<void>;
}

import { Token } from "typedi";

export const EMAIL_SERVICE_TOKEN = new Token<IEmailService>("email-service");
export const emailProviderToken = (type: EmailProviderType) =>
  new Token<IEmailProvider>(`email-provider-${type}`);
