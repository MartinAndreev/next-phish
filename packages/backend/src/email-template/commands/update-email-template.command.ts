import { EmailTemplateRepository } from "../repositories";
import { EmailTemplateService } from "../services";
import type { EmailTemplateView, UpdateEmailTemplateData } from "../types";
import type { ICommandHandler } from "../../message-bus";

interface UpdateEmailTemplateDataWithScope {
  id: string;
  organizationId: string;
  data: UpdateEmailTemplateData;
}

export class UpdateEmailTemplateCommand implements ICommandHandler<
  UpdateEmailTemplateDataWithScope,
  EmailTemplateView
> {
  constructor(
    private readonly emailTemplateRepo: EmailTemplateRepository,
    private readonly emailTemplateService: EmailTemplateService,
  ) {}

  async execute(
    input: UpdateEmailTemplateDataWithScope,
  ): Promise<EmailTemplateView> {
    const row = await this.emailTemplateRepo.update(
      input.id,
      input.organizationId,
      input.data,
    );

    return this.emailTemplateService.toView(row);
  }
}
