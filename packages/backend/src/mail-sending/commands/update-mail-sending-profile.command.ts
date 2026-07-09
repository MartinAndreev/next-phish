import { MailSendingProfileService } from "../services";
import type { MailSendingProfileView } from "../types";
import type { ICommandHandler } from "../../message-bus";
import type { UpdateMailSendingProfileInput } from "../validations";

export interface UpdateMailSendingProfileData extends UpdateMailSendingProfileInput {
  organizationId: string;
}

export class UpdateMailSendingProfileCommand implements ICommandHandler<
  UpdateMailSendingProfileData,
  MailSendingProfileView | null
> {
  constructor(private readonly service: MailSendingProfileService) {}

  async execute(
    data: UpdateMailSendingProfileData,
  ): Promise<MailSendingProfileView | null> {
    return this.service.update(data.id, data.organizationId, {
      name: data.name,
      fromName: data.fromName,
      fromEmail: data.fromEmail,
      replyToEmail: data.replyToEmail,
      headers: data.headers,
      providerConfig: data.providerConfig,
      isDefault: data.isDefault,
    });
  }
}
