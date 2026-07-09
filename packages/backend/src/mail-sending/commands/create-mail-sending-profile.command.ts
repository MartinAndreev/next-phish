import { MailSendingProfileService } from "../services";
import type { MailSendingProfileView } from "../types";
import type { ICommandHandler } from "../../message-bus";
import type { CreateMailSendingProfileInput } from "../validations";

export interface CreateMailSendingProfileData extends CreateMailSendingProfileInput {
  organizationId: string;
}

export class CreateMailSendingProfileCommand implements ICommandHandler<
  CreateMailSendingProfileData,
  MailSendingProfileView
> {
  constructor(private readonly service: MailSendingProfileService) {}

  async execute(
    data: CreateMailSendingProfileData,
  ): Promise<MailSendingProfileView> {
    return this.service.create({
      organizationId: data.organizationId,
      name: data.name,
      providerType: data.providerType,
      fromName: data.fromName,
      fromEmail: data.fromEmail,
      replyToEmail: data.replyToEmail,
      headers: data.headers,
      providerConfig: data.providerConfig,
      isDefault: data.isDefault,
    });
  }
}
