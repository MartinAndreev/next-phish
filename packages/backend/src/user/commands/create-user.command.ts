import { UserRepository } from "../repositories";
import type { CreateUserData, UserView } from "../types";
import type { ICommandHandler } from "../../message-bus";
import { randomUUID } from "node:crypto";

export class CreateUserCommand implements ICommandHandler<
  CreateUserData,
  UserView
> {
  constructor(private readonly userRepo: UserRepository) {}

  async execute(data: CreateUserData): Promise<UserView> {
    const id = randomUUID();
    return this.userRepo.create({ ...data, id });
  }
}
