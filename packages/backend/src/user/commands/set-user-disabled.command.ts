import type { ICommandHandler } from "../../message-bus";
import { UserRepository } from "../repositories";

export class SetUserDisabledCommand implements ICommandHandler<
  { userId: string; disabled: boolean },
  void
> {
  constructor(private readonly repository: UserRepository) {}

  execute(input: { userId: string; disabled: boolean }) {
    return this.repository.setDisabled(input.userId, input.disabled);
  }
}
