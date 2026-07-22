import {
  mcpIdWithOrgSchema,
  mcpListTasksSchema,
  mcpCreateTaskSchema,
  mcpUpdateTaskSchema,
  mcpMoveTaskSchema,
  mcpCreateTaskStatusSchema,
  mcpUpdateTaskStatusSchema,
  mcpReorderTaskStatusesSchema,
  mcpDeleteTaskStatusSchema,
} from "@next-phish/shared";
import type { GetCaller, McpServer } from "./types";

const response = (result: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(result) }],
});

export function registerTaskTools(server: McpServer, getCaller: GetCaller) {
  server.registerTool(
    "list_tasks",
    {
      description:
        "List organization tasks, optionally filtered by status, assignee, or search text.",
      inputSchema: mcpListTasksSchema,
    },
    async ({ organizationId, ...input }) =>
      response(
        await (
          await getCaller(organizationId)
        ).caller.task.list({ organizationId, ...input }),
      ),
  );
  server.registerTool(
    "get_task",
    {
      description: "Get an organization task by ID.",
      inputSchema: mcpIdWithOrgSchema,
    },
    async ({ organizationId, id }) =>
      response(
        await (
          await getCaller(organizationId)
        ).caller.task.get({ organizationId, id }),
      ),
  );
  server.registerTool(
    "create_task",
    {
      description: "Create a task linked optionally to one NextPhish resource.",
      inputSchema: mcpCreateTaskSchema,
    },
    async (input) =>
      response(
        await (await getCaller(input.organizationId)).caller.task.create(input),
      ),
  );
  server.registerTool(
    "update_task",
    {
      description: "Update task fields. Omitted fields are unchanged.",
      inputSchema: mcpUpdateTaskSchema,
    },
    async (input) =>
      response(
        await (await getCaller(input.organizationId)).caller.task.update(input),
      ),
  );
  server.registerTool(
    "move_task",
    {
      description: "Move a task to another organization task status.",
      inputSchema: mcpMoveTaskSchema,
    },
    async (input) =>
      response(
        await (await getCaller(input.organizationId)).caller.task.move(input),
      ),
  );
  server.registerTool(
    "delete_task",
    {
      description: "Delete an organization task.",
      inputSchema: mcpIdWithOrgSchema,
    },
    async (input) =>
      response(
        await (await getCaller(input.organizationId)).caller.task.delete(input),
      ),
  );
  server.registerTool(
    "list_task_statuses",
    {
      description: "List ordered task workflow statuses and task counts.",
      inputSchema: mcpListTasksSchema.pick({ organizationId: true }),
    },
    async ({ organizationId }) =>
      response(
        await (
          await getCaller(organizationId)
        ).caller.task.statuses({ organizationId }),
      ),
  );
  server.registerTool(
    "create_task_status",
    {
      description: "Create an organization task status (owner/admin).",
      inputSchema: mcpCreateTaskStatusSchema,
    },
    async (input) =>
      response(
        await (
          await getCaller(input.organizationId)
        ).caller.task.createStatus(input),
      ),
  );
  server.registerTool(
    "update_task_status",
    {
      description:
        "Update an organization task status name, color, or completion behavior (owner/admin).",
      inputSchema: mcpUpdateTaskStatusSchema,
    },
    async (input) =>
      response(
        await (
          await getCaller(input.organizationId)
        ).caller.task.updateStatus(input),
      ),
  );
  server.registerTool(
    "reorder_task_statuses",
    {
      description: "Set the complete task status order (owner/admin).",
      inputSchema: mcpReorderTaskStatusesSchema,
    },
    async (input) =>
      response(
        await (
          await getCaller(input.organizationId)
        ).caller.task.reorderStatuses(input),
      ),
  );
  server.registerTool(
    "delete_task_status",
    {
      description:
        "Delete a task status, moving existing tasks to replacementStatusId (owner/admin).",
      inputSchema: mcpDeleteTaskStatusSchema,
    },
    async (input) =>
      response(
        await (
          await getCaller(input.organizationId)
        ).caller.task.deleteStatus(input),
      ),
  );
}
