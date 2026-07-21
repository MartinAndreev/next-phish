import { PageRepository } from "../repositories";
import { PageService } from "../services";
import type { PageListItemView } from "../types";
import type { GetPagesInput } from "../validations";
import type { IQueryHandler } from "../../message-bus";

interface GetPagesInputWithOrganizationId extends GetPagesInput {
  organizationId: string;
}

interface GetPagesResult {
  pages: PageListItemView[];
  total: number;
}

export class GetPagesQuery implements IQueryHandler<
  GetPagesInputWithOrganizationId,
  GetPagesResult
> {
  constructor(
    private readonly pageRepo: PageRepository,
    private readonly pageService: PageService,
  ) {}

  async execute(
    input: GetPagesInputWithOrganizationId,
  ): Promise<GetPagesResult> {
    const { rows, total } = await this.pageRepo.findByOrganizationId(
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
      pages: this.pageService.toListItemViews(rows),
      total,
    };
  }
}
