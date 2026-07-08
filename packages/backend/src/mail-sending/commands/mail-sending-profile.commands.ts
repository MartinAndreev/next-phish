import { MailSendingProfileService } from "../services";
import type { MailSendingProfileView } from "../types";
import type { ICommandHandler } from "../../message-bus";
import type {
  CreateMailSendingProfileInput,
  UpdateMailSendingProfileInput,
  DeleteMailSendingProfileInput,
  SendTestEmailInput,
  VerifyConnectionInput,
} from "../validations";
import { MailDispatcherService } from "../services/mail-dispatcher.service";
import type { SendMailResult, ConnectionTestResult } from "../providers";

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

export interface VerifyConnectionData extends VerifyConnectionInput {
  organizationId: string;
}

export class VerifyConnectionCommand implements ICommandHandler<
  VerifyConnectionData,
  ConnectionTestResult
> {
  constructor(private readonly dispatcher: MailDispatcherService) {}

  async execute(data: VerifyConnectionData): Promise<ConnectionTestResult> {
    return this.dispatcher.verifyConnection(
      data.profileId,
      data.organizationId,
    );
  }
}
