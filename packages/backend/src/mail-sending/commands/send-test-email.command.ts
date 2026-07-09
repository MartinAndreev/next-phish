import { MailDispatcherService } from "../services/mail-dispatcher.service";
import type { SendMailResult } from "../providers";
import type { ICommandHandler } from "../../message-bus";
import type { SendTestEmailInput } from "../validations";

export interface SendTestEmailData extends SendTestEmailInput {
  organizationId: string;
}

export class SendTestEmailCommand implements ICommandHandler<
  SendTestEmailData,
  SendMailResult
> {
  constructor(private readonly dispatcher: MailDispatcherService) {}

  async execute(data: SendTestEmailData): Promise<SendMailResult> {
    return this.dispatcher.sendTest(data.profileId, data.organizationId, {
      toEmail: data.toEmail,
    });
  }
}
