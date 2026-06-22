import { EmailTemplateRepository } from "../repositories";
import { EmailTemplateService } from "../services";
import type { EmailTemplateView } from "../types";
import type { IQueryHandler } from "../../message-bus";

interface GetEmailTemplateByIdData {
  id: string;
  organizationId: string;
}

export class GetEmailTemplateByIdQuery implements IQueryHandler<
  GetEmailTemplateByIdData,
  EmailTemplateView | null
> {
  constructor(
    private readonly emailTemplateRepo: EmailTemplateRepository,
    private readonly emailTemplateService: EmailTemplateService,
  ) {}

  async execute(
    input: GetEmailTemplateByIdData,
  ): Promise<EmailTemplateView | null> {
    const row = await this.emailTemplateRepo.findById(
      input.id,
      input.organizationId,
    );

    return row ? this.emailTemplateService.toView(row) : null;
  }
}
