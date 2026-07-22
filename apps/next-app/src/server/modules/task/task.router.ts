import { Container } from "@/src/server/container";
import {
  MessageBus,
  ListTasksQuery,
  GetTaskQuery,
  ListTaskStatusesQuery,
  CreateTaskCommand,
  UpdateTaskCommand,
  MoveTaskCommand,
  DeleteTaskCommand,
  CreateTaskStatusCommand,
  UpdateTaskStatusCommand,
  ReorderTaskStatusesCommand,
  DeleteTaskStatusCommand,
  ListTasksSchema,
  GetTaskSchema,
  CreateTaskSchema,
  UpdateTaskSchema,
  MoveTaskSchema,
  DeleteTaskSchema,
  CreateTaskStatusSchema,
  UpdateTaskStatusSchema,
  ReorderTaskStatusesSchema,
  DeleteTaskStatusSchema,
} from "@next-phish/backend";
import { toRouterPermissions } from "@next-phish/shared";
import { createPermissionProcedure, router } from "../../trpc/procedures";

const bus = Container.get(MessageBus);
const read = createPermissionProcedure(toRouterPermissions("tasks", "read"));
const write = createPermissionProcedure(toRouterPermissions("tasks", "write"));
const statusRead = createPermissionProcedure(
  toRouterPermissions("task-statuses", "read"),
);
const statusWrite = createPermissionProcedure(
  toRouterPermissions("task-statuses", "write"),
);

export const taskRouter = router({
  list: read.input(ListTasksSchema).query(({ ctx, input }) =>
    bus.query(Container.get(ListTasksQuery), {
      ...input,
      organizationId: ctx.activeOrganizationId,
    }),
  ),
  get: read.input(GetTaskSchema).query(({ ctx, input }) =>
    bus.query(Container.get(GetTaskQuery), {
      ...input,
      organizationId: ctx.activeOrganizationId,
    }),
  ),
  statuses: statusRead.query(({ ctx }) =>
    bus.query(Container.get(ListTaskStatusesQuery), {
      organizationId: ctx.activeOrganizationId,
    }),
  ),
  create: write.input(CreateTaskSchema).mutation(({ ctx, input }) =>
    bus.dispatch(Container.get(CreateTaskCommand), {
      organizationId: ctx.activeOrganizationId,
      createdById: ctx.userId,
      data: input,
    }),
  ),
  update: write.input(UpdateTaskSchema).mutation(({ ctx, input }) => {
    const { id, ...data } = input;
    return bus.dispatch(Container.get(UpdateTaskCommand), {
      id,
      organizationId: ctx.activeOrganizationId,
      data,
    });
  }),
  move: write.input(MoveTaskSchema).mutation(({ ctx, input }) =>
    bus.dispatch(Container.get(MoveTaskCommand), {
      ...input,
      organizationId: ctx.activeOrganizationId,
    }),
  ),
  delete: write.input(DeleteTaskSchema).mutation(({ ctx, input }) =>
    bus.dispatch(Container.get(DeleteTaskCommand), {
      ...input,
      organizationId: ctx.activeOrganizationId,
    }),
  ),
  createStatus: statusWrite
    .input(CreateTaskStatusSchema)
    .mutation(({ ctx, input }) =>
      bus.dispatch(Container.get(CreateTaskStatusCommand), {
        organizationId: ctx.activeOrganizationId,
        actorId: ctx.userId,
        data: input,
      }),
    ),
  updateStatus: statusWrite
    .input(UpdateTaskStatusSchema)
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return bus.dispatch(Container.get(UpdateTaskStatusCommand), {
        id,
        organizationId: ctx.activeOrganizationId,
        actorId: ctx.userId,
        data,
      });
    }),
  reorderStatuses: statusWrite
    .input(ReorderTaskStatusesSchema)
    .mutation(({ ctx, input }) =>
      bus.dispatch(Container.get(ReorderTaskStatusesCommand), {
        ...input,
        organizationId: ctx.activeOrganizationId,
        actorId: ctx.userId,
      }),
    ),
  deleteStatus: statusWrite
    .input(DeleteTaskStatusSchema)
    .mutation(({ ctx, input }) =>
      bus.dispatch(Container.get(DeleteTaskStatusCommand), {
        ...input,
        organizationId: ctx.activeOrganizationId,
        actorId: ctx.userId,
      }),
    ),
});
