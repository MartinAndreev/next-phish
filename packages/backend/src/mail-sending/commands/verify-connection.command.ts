import { MailDispatcherService } from "../services/mail-dispatcher.service";
import type { ConnectionTestResult } from "../providers";
import type { ICommandHandler } from "../../message-bus";
import type { VerifyConnectionInput } from "../validations";

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
