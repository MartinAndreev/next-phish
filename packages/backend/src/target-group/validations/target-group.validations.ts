import { z } from "zod";
import { targetGroupStatusSchema } from "@next-phish/shared";

const sortOrderSchema = z.enum(["asc", "desc"]);
const sortFieldSchema = z.enum(["name", "status", "createdAt", "updatedAt"]);

const sortSchema = z.object({
  field: sortFieldSchema,
  order: sortOrderSchema,
});

export const GetTargetGroupsSchema = z.object({
  search: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
  sort: z.array(sortSchema).optional(),
  filters: z
    .object({
      status: targetGroupStatusSchema.optional(),
    })
    .optional(),
});

export const GetTargetGroupByIdSchema = z.object({
  id: z.string(),
});

export const GetTargetGroupUsersSchema = z.object({
  targetGroupId: z.string(),
  search: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

export const CreateTargetGroupCommandSchema = z.object({
  name: z.string().trim().min(1, "Group name is required"),
  status: targetGroupStatusSchema.default("DRAFT"),
  users: z
    .array(
      z.object({
        email: z.string().email(),
        firstName: z.string().trim().min(1),
        lastName: z.string().trim().min(1),
        position: z.string().trim().optional(),
      }),
    )
    .optional(),
});

export const UpdateTargetGroupCommandSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, "Group name is required"),
  status: targetGroupStatusSchema,
});

export const DeleteTargetGroupCommandSchema = z.object({
  id: z.string(),
});

export const RemoveUserSchema = z.object({
  id: z.string(),
  targetGroupId: z.string(),
});

export const AddUserSchema = z.object({
  targetGroupId: z.string(),
  email: z.string().email(),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  position: z.string().trim().optional(),
});

export const ImportUsersSchema = z.object({
  targetGroupId: z.string(),
  mode: z.enum(["insert", "upsert"]),
  fileId: z.string(),
  fileName: z.string(),
});

export const ImportProgressSchema = z.object({
  jobId: z.string(),
});

export const ImportTargetGroupUsersCommandSchema = z.object({
  targetGroupId: z.string(),
  mode: z.enum(["insert", "upsert"]),
  fileId: z.string(),
  fileName: z.string(),
});

export type GetTargetGroupsInput = z.infer<typeof GetTargetGroupsSchema>;
export type GetTargetGroupByIdInput = z.infer<typeof GetTargetGroupByIdSchema>;
export type GetTargetGroupUsersInput = z.infer<
  typeof GetTargetGroupUsersSchema
>;
export type CreateTargetGroupCommandInput = z.infer<
  typeof CreateTargetGroupCommandSchema
>;
export type UpdateTargetGroupCommandInput = z.infer<
  typeof UpdateTargetGroupCommandSchema
>;
export type DeleteTargetGroupCommandInput = z.infer<
  typeof DeleteTargetGroupCommandSchema
>;
export type RemoveUserInput = z.infer<typeof RemoveUserSchema>;
export type AddUserInput = z.infer<typeof AddUserSchema>;
export type ImportUsersInput = z.infer<typeof ImportUsersSchema>;
export type ImportProgressInput = z.infer<typeof ImportProgressSchema>;
export type ImportTargetGroupUsersCommandInput = z.infer<
  typeof ImportTargetGroupUsersCommandSchema
>;
