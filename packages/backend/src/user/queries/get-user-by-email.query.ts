import { UserRepository } from "../repositories";
import type { UserView } from "../types";
import type { IQueryHandler } from "../../message-bus";

export class GetUserByEmailQuery implements IQueryHandler<
  { email: string },
  UserView | null
> {
  constructor(private readonly userRepo: UserRepository) {}

  async execute(data: { email: string }): Promise<UserView | null> {
    return this.userRepo.findByEmail(data.email);
  }
}
