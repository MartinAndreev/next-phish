import { Container } from "typedi";
import type { PrismaClient } from "@next-phish/database";
import { UserRepository } from "./repositories";
import { CreateUserCommand } from "./commands";
import { GetUserCountQuery, GetUserByEmailQuery } from "./queries";

export function registerUserServices(db: PrismaClient): void {
  const userRepo = new UserRepository(db);
  Container.set(UserRepository, userRepo);
  Container.set(CreateUserCommand, new CreateUserCommand(userRepo));
  Container.set(GetUserCountQuery, new GetUserCountQuery(userRepo));
  Container.set(GetUserByEmailQuery, new GetUserByEmailQuery(userRepo));
}
