import { EmailTemplateRepository } from "../repositories";
import { EmailTemplateService } from "../services";
import type { EmailTemplateListItemView } from "../types";
import type { GetEmailTemplatesInput } from "../validations";
import type { IQueryHandler } from "../../message-bus";

interface GetEmailTemplatesInputWithOrganizationId extends GetEmailTemplatesInput {
  organizationId: string;
}

interface GetEmailTemplatesResult {
  emailTemplates: EmailTemplateListItemView[];
  total: number;
}

export class GetEmailTemplatesQuery implements IQueryHandler<
  GetEmailTemplatesInputWithOrganizationId,
  GetEmailTemplatesResult
> {
  constructor(
    private readonly emailTemplateRepo: EmailTemplateRepository,
    private readonly emailTemplateService: EmailTemplateService,
  ) {}

  async execute(
    input: GetEmailTemplatesInputWithOrganizationId,
  ): Promise<GetEmailTemplatesResult> {
    const { rows, total } = await this.emailTemplateRepo.findByOrganizationId(
      input.organizationId,
      {
        search: input.search,
        selectedId: input.selectedId,
        includeContent: input.includeContent,
        limit: input.limit,
        offset: input.offset,
        sort: input.sort,
        filters: input.filters,
      },
    );

    return {
      emailTemplates: this.emailTemplateService.toListItemViews(rows),
      total,
    };
  }
}
