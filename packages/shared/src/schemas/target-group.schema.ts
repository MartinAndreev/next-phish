import { z } from "zod";

export const targetGroupStatusSchema = z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]);

export const targetGroupUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  position: z.string().trim().optional(),
});

export const createTargetGroupSchema = z.object({
  name: z.string().trim().min(1, "Group name is required"),
  status: targetGroupStatusSchema.default("DRAFT"),
  users: z.array(targetGroupUserSchema).optional(),
});

export const updateTargetGroupSchema = createTargetGroupSchema.extend({
  id: z.string(),
});

export const importTargetGroupUsersSchema = z.object({
  targetGroupId: z.string(),
  mode: z.enum(["insert", "upsert"]),
  file: z.string(),
  fileName: z.string(),
});

export type CreateTargetGroupInput = z.infer<typeof createTargetGroupSchema>;
export type UpdateTargetGroupInput = z.infer<typeof updateTargetGroupSchema>;
export type ImportTargetGroupUsersInput = z.infer<
  typeof importTargetGroupUsersSchema
>;
export type TargetGroupUserInput = z.infer<typeof targetGroupUserSchema>;
