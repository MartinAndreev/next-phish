import type { ICommandHandler } from "../../message-bus";
import { PageRepository } from "../repositories";

interface DeletePageData {
  id: string;
  organizationId: string;
}

export class DeletePageCommand implements ICommandHandler<
  DeletePageData,
  boolean
> {
  constructor(private readonly pageRepo: PageRepository) {}

  async execute(input: DeletePageData): Promise<boolean> {
    return this.pageRepo.delete(input.id, input.organizationId);
  }
}
