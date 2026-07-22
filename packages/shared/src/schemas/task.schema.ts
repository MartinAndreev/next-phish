import { z } from "zod";

export const taskPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH"]);
export const taskStatusColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Choose a valid status color");
export const taskResourceTypeSchema = z.enum([
  "CAMPAIGN",
  "SCHEDULE",
  "PAGE",
  "EMAIL_TEMPLATE",
  "TARGET_GROUP",
  "SENDING_PROFILE",
]);

export const taskRelationSchema = z
  .object({ type: taskResourceTypeSchema, id: z.string().min(1) })
  .nullable()
  .optional();

export const taskFormSchema = z.object({
  title: z.string().trim().min(1, "Task title is required").max(200),
  description: z.string().trim().max(4000).optional().default(""),
  statusId: z.string().min(1, "Status is required"),
  priority: taskPrioritySchema.default("MEDIUM"),
  assigneeId: z.string().nullable().optional(),
  dueAt: z
    .string()
    .nullable()
    .optional()
    .refine((value) => !value || !Number.isNaN(Date.parse(value)), {
      message: "Choose a valid due date",
    }),
  relation: taskRelationSchema,
});

export const taskStatusFormSchema = z.object({
  name: z.string().trim().min(1, "Status name is required").max(40),
  colorToken: taskStatusColorSchema.default("#64748b"),
  marksTaskDone: z.boolean().default(false),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;
export type TaskStatusFormValues = z.infer<typeof taskStatusFormSchema>;
export type TaskResourceType = z.infer<typeof taskResourceTypeSchema>;
