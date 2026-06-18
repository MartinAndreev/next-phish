import { UserRepository } from "../repositories";
import type { IQueryHandler } from "../../message-bus";

export class GetUserCountQuery implements IQueryHandler<object, number> {
  constructor(private readonly userRepo: UserRepository) {}

  async execute(): Promise<number> {
    return this.userRepo.count();
  }
}
