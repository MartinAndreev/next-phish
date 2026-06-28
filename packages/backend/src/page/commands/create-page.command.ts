import { PageRepository } from "../repositories";
import { PageService } from "../services";
import type { CreatePageData, PageView } from "../types";
import type { ICommandHandler } from "../../message-bus";

export class CreatePageCommand implements ICommandHandler<
  CreatePageData,
  PageView
> {
  constructor(
    private readonly pageRepo: PageRepository,
    private readonly pageService: PageService,
  ) {}

  async execute(data: CreatePageData): Promise<PageView> {
    const row = await this.pageRepo.create(data);
    return this.pageService.toView(row);
  }
}
