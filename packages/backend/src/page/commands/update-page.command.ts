import { PageRepository } from "../repositories";
import { PageService } from "../services";
import type { PageView, UpdatePageData } from "../types";
import type { ICommandHandler } from "../../message-bus";

interface UpdatePageDataWithScope {
  id: string;
  organizationId: string;
  data: UpdatePageData;
}

export class UpdatePageCommand implements ICommandHandler<
  UpdatePageDataWithScope,
  PageView
> {
  constructor(
    private readonly pageRepo: PageRepository,
    private readonly pageService: PageService,
  ) {}

  async execute(input: UpdatePageDataWithScope): Promise<PageView> {
    const row = await this.pageRepo.update(
      input.id,
      input.organizationId,
      input.data,
    );

    return this.pageService.toView(row);
  }
}
