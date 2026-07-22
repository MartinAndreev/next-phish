import type { IQueryHandler } from "../../message-bus";
import type { UserDeletionPreview } from "../types";
import { UserRepository } from "../repositories";

export class GetUserDeletionPreviewQuery implements IQueryHandler<
  { userId: string },
  UserDeletionPreview
> {
  constructor(private readonly repository: UserRepository) {}

  execute(input: { userId: string }) {
    return this.repository.getDeletionPreview(input.userId);
  }
}
