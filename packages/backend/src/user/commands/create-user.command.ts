import { UserRepository } from "../repositories";
import type { CreateUserData, UserView, WelcomeUserJob } from "../types";
import type { ICommandHandler } from "../../message-bus";

export class CreateUserCommand implements ICommandHandler<
  CreateUserData,
  { user: UserView; welcomeJob: WelcomeUserJob }
> {
  constructor(private readonly userRepo: UserRepository) {}

  execute(data: CreateUserData) {
    return this.userRepo.create(data);
  }
}
