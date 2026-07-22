import { Container } from "typedi";
import type { PrismaClient } from "@prisma/client";
import { TaskRepository } from "./repositories/task.repository";
import {
  ListTasksQuery,
  GetTaskQuery,
  ListTaskStatusesQuery,
} from "./queries/task.queries";
import {
  CreateTaskCommand,
  UpdateTaskCommand,
  MoveTaskCommand,
  DeleteTaskCommand,
  CreateTaskStatusCommand,
  UpdateTaskStatusCommand,
  ReorderTaskStatusesCommand,
  DeleteTaskStatusCommand,
} from "./commands/task.commands";

export function registerTaskServices(db: PrismaClient): void {
  const repo = new TaskRepository(db);
  Container.set(TaskRepository, repo);
  Container.set(ListTasksQuery, new ListTasksQuery(repo));
  Container.set(GetTaskQuery, new GetTaskQuery(repo));
  Container.set(ListTaskStatusesQuery, new ListTaskStatusesQuery(repo));
  Container.set(CreateTaskCommand, new CreateTaskCommand(repo));
  Container.set(UpdateTaskCommand, new UpdateTaskCommand(repo));
  Container.set(MoveTaskCommand, new MoveTaskCommand(repo));
  Container.set(DeleteTaskCommand, new DeleteTaskCommand(repo));
  Container.set(CreateTaskStatusCommand, new CreateTaskStatusCommand(repo));
  Container.set(UpdateTaskStatusCommand, new UpdateTaskStatusCommand(repo));
  Container.set(
    ReorderTaskStatusesCommand,
    new ReorderTaskStatusesCommand(repo),
  );
  Container.set(DeleteTaskStatusCommand, new DeleteTaskStatusCommand(repo));
}
