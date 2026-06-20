import type { ICommandHandler } from "../../message-bus";
import { EmailTemplateRepository } from "../repositories";

interface DeleteEmailTemplateData {
  id: string;
  organizationId: string;
}

export class DeleteEmailTemplateCommand implements ICommandHandler<
  DeleteEmailTemplateData,
  boolean
> {
  constructor(private readonly emailTemplateRepo: EmailTemplateRepository) {}

  async execute(input: DeleteEmailTemplateData): Promise<boolean> {
    return this.emailTemplateRepo.delete(input.id, input.organizationId);
  }
}
