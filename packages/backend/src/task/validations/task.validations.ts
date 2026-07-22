import { z } from "zod";
import { taskFormSchema, taskStatusFormSchema } from "@next-phish/shared";

export const ListTasksSchema = z.object({
  statusIds: z.array(z.string()).max(20).optional(),
  assigneeId: z.string().optional(),
  search: z.string().trim().max(200).optional(),
  limit: z.number().min(1).max(100).default(100),
  offset: z.number().min(0).default(0),
});
export const GetTaskSchema = z.object({ id: z.string() });
export const CreateTaskSchema = taskFormSchema;
export const UpdateTaskSchema = taskFormSchema
  .partial()
  .extend({ id: z.string() });
export const MoveTaskSchema = z.object({
  id: z.string(),
  statusId: z.string(),
});
export const DeleteTaskSchema = z.object({ id: z.string() });
export const CreateTaskStatusSchema = taskStatusFormSchema;
export const UpdateTaskStatusSchema = taskStatusFormSchema
  .partial()
  .extend({ id: z.string() });
export const ReorderTaskStatusesSchema = z.object({
  statusIds: z
    .array(z.string())
    .min(1)
    .max(20)
    .refine(
      (ids) => new Set(ids).size === ids.length,
      "Status IDs must be unique",
    ),
});
export const DeleteTaskStatusSchema = z.object({
  id: z.string(),
  replacementStatusId: z.string().optional(),
});
