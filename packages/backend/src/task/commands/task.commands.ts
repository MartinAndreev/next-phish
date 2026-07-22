import type { ICommandHandler } from "../../message-bus";
import { TaskRepository } from "../repositories/task.repository";
import type {
  TaskStatusView,
  TaskStatusWriteData,
  TaskView,
  TaskWriteData,
} from "../types/task.types";

export class CreateTaskCommand implements ICommandHandler<
  { organizationId: string; createdById: string; data: TaskWriteData },
  TaskView
> {
  constructor(private readonly repo: TaskRepository) {}
  execute(input: {
    organizationId: string;
    createdById: string;
    data: TaskWriteData;
  }) {
    return this.repo.create(
      input.organizationId,
      input.createdById,
      input.data,
    );
  }
}
export class UpdateTaskCommand implements ICommandHandler<
  { id: string; organizationId: string; data: Partial<TaskWriteData> },
  TaskView
> {
  constructor(private readonly repo: TaskRepository) {}
  execute(input: {
    id: string;
    organizationId: string;
    data: Partial<TaskWriteData>;
  }) {
    return this.repo.update(input.id, input.organizationId, input.data);
  }
}
export class MoveTaskCommand implements ICommandHandler<
  { id: string; organizationId: string; statusId: string },
  TaskView
> {
  constructor(private readonly repo: TaskRepository) {}
  execute(input: { id: string; organizationId: string; statusId: string }) {
    return this.repo.move(input.id, input.organizationId, input.statusId);
  }
}
export class DeleteTaskCommand implements ICommandHandler<
  { id: string; organizationId: string },
  boolean
> {
  constructor(private readonly repo: TaskRepository) {}
  execute(input: { id: string; organizationId: string }) {
    return this.repo.delete(input.id, input.organizationId);
  }
}
export class CreateTaskStatusCommand implements ICommandHandler<
  { organizationId: string; actorId: string; data: TaskStatusWriteData },
  TaskStatusView
> {
  constructor(private readonly repo: TaskRepository) {}
  execute(input: {
    organizationId: string;
    actorId: string;
    data: TaskStatusWriteData;
  }) {
    return this.repo.createStatus(
      input.organizationId,
      input.actorId,
      input.data,
    );
  }
}
export class UpdateTaskStatusCommand implements ICommandHandler<
  {
    id: string;
    organizationId: string;
    actorId: string;
    data: Partial<TaskStatusWriteData>;
  },
  TaskStatusView
> {
  constructor(private readonly repo: TaskRepository) {}
  execute(input: {
    id: string;
    organizationId: string;
    actorId: string;
    data: Partial<TaskStatusWriteData>;
  }) {
    return this.repo.updateStatus(
      input.id,
      input.organizationId,
      input.actorId,
      input.data,
    );
  }
}
export class ReorderTaskStatusesCommand implements ICommandHandler<
  { organizationId: string; actorId: string; statusIds: string[] },
  TaskStatusView[]
> {
  constructor(private readonly repo: TaskRepository) {}
  execute(input: {
    organizationId: string;
    actorId: string;
    statusIds: string[];
  }) {
    return this.repo.reorderStatuses(
      input.organizationId,
      input.actorId,
      input.statusIds,
    );
  }
}
export class DeleteTaskStatusCommand implements ICommandHandler<
  {
    id: string;
    organizationId: string;
    actorId: string;
    replacementStatusId?: string;
  },
  boolean
> {
  constructor(private readonly repo: TaskRepository) {}
  execute(input: {
    id: string;
    organizationId: string;
    actorId: string;
    replacementStatusId?: string;
  }) {
    return this.repo.deleteStatus(
      input.id,
      input.organizationId,
      input.actorId,
      input.replacementStatusId,
    );
  }
}
