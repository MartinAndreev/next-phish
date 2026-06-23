import { PageRepository } from "../repositories";
import { PageService } from "../services";
import type { PageView } from "../types";
import type { IQueryHandler } from "../../message-bus";

interface GetPageByIdData {
  id: string;
  organizationId: string;
}

export class GetPageByIdQuery implements IQueryHandler<
  GetPageByIdData,
  PageView | null
> {
  constructor(
    private readonly pageRepo: PageRepository,
    private readonly pageService: PageService,
  ) {}

  async execute(input: GetPageByIdData): Promise<PageView | null> {
    const row = await this.pageRepo.findById(input.id, input.organizationId);

    return row ? this.pageService.toView(row) : null;
  }
}
