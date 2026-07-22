import type { IQueryHandler } from "../../message-bus";
import type { UserView } from "../types";
import type { ListUsersInput } from "../validations";
import { UserRepository } from "../repositories";

export class ListUsersQuery implements IQueryHandler<
  ListUsersInput,
  { users: UserView[]; total: number }
> {
  constructor(private readonly repository: UserRepository) {}

  execute(input: ListUsersInput) {
    return this.repository.list(input);
  }
}
