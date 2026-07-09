import { MailSendingProfileService } from "../services";
import type { ICommandHandler } from "../../message-bus";
import type { DeleteMailSendingProfileInput } from "../validations";

export interface DeleteMailSendingProfileData extends DeleteMailSendingProfileInput {
  organizationId: string;
}

export class DeleteMailSendingProfileCommand implements ICommandHandler<
  DeleteMailSendingProfileData,
  boolean
> {
  constructor(private readonly service: MailSendingProfileService) {}

  async execute(data: DeleteMailSendingProfileData): Promise<boolean> {
    return this.service.delete(data.id, data.organizationId);
  }
}
