import type { IQueryHandler } from "../../message-bus";
import { TaskRepository } from "../repositories/task.repository";
import type { TaskStatusView, TaskView } from "../types/task.types";

export class ListTasksQuery implements IQueryHandler<
  {
    organizationId: string;
    statusIds?: string[];
    assigneeId?: string;
    search?: string;
    limit: number;
    offset: number;
  },
  { tasks: TaskView[]; total: number }
> {
  constructor(private readonly repo: TaskRepository) {}
  execute({
    organizationId,
    ...input
  }: {
    organizationId: string;
    statusIds?: string[];
    assigneeId?: string;
    search?: string;
    limit: number;
    offset: number;
  }) {
    return this.repo.list(organizationId, input);
  }
}
export class GetTaskQuery implements IQueryHandler<
  { id: string; organizationId: string },
  TaskView | null
> {
  constructor(private readonly repo: TaskRepository) {}
  execute(input: { id: string; organizationId: string }) {
    return this.repo.get(input.id, input.organizationId);
  }
}
export class ListTaskStatusesQuery implements IQueryHandler<
  { organizationId: string },
  TaskStatusView[]
> {
  constructor(private readonly repo: TaskRepository) {}
  execute(input: { organizationId: string }) {
    return this.repo.listStatuses(input.organizationId);
  }
}
