import { EmailTemplateRepository } from "../repositories";
import { EmailTemplateService } from "../services";
import type { CreateEmailTemplateData, EmailTemplateView } from "../types";
import type { ICommandHandler } from "../../message-bus";

export class CreateEmailTemplateCommand implements ICommandHandler<
  CreateEmailTemplateData,
  EmailTemplateView
> {
  constructor(
    private readonly emailTemplateRepo: EmailTemplateRepository,
    private readonly emailTemplateService: EmailTemplateService,
  ) {}

  async execute(data: CreateEmailTemplateData): Promise<EmailTemplateView> {
    const row = await this.emailTemplateRepo.create(data);
    return this.emailTemplateService.toView(row);
  }
}
