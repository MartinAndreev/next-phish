import { Container } from "typedi";
import type { PrismaClient } from "@next-phish/database";
import { UserRepository } from "./repositories";
import {
  CreateUserCommand,
  DeleteUserCommand,
  SetUserDisabledCommand,
} from "./commands";
import {
  GetUserCountQuery,
  GetUserByEmailQuery,
  GetUserDeletionPreviewQuery,
  ListUsersQuery,
} from "./queries";

export function registerUserServices(db: PrismaClient): void {
  const userRepo = new UserRepository(db);
  Container.set(UserRepository, userRepo);
  Container.set(CreateUserCommand, new CreateUserCommand(userRepo));
  Container.set(GetUserCountQuery, new GetUserCountQuery(userRepo));
  Container.set(GetUserByEmailQuery, new GetUserByEmailQuery(userRepo));
  Container.set(ListUsersQuery, new ListUsersQuery(userRepo));
  Container.set(
    GetUserDeletionPreviewQuery,
    new GetUserDeletionPreviewQuery(userRepo),
  );
  Container.set(SetUserDisabledCommand, new SetUserDisabledCommand(userRepo));
  Container.set(DeleteUserCommand, new DeleteUserCommand(userRepo));
}
