import type { ICommandHandler } from "../../message-bus";
import type { OrphanUserAction } from "../types";
import { UserRepository } from "../repositories";

export class DeleteUserCommand implements ICommandHandler<
  { userId: string; orphanAction: OrphanUserAction },
  void
> {
  constructor(private readonly repository: UserRepository) {}

  execute(input: { userId: string; orphanAction: OrphanUserAction }) {
    return this.repository.delete(input.userId, input.orphanAction);
  }
}
