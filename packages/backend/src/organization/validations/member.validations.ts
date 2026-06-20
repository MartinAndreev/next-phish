import { z } from "zod";

export const GetOrganizationMembersSchema = z.object({
  organizationId: z.string(),
  search: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
  sort: z
    .array(
      z.object({
        field: z.enum(["role", "createdAt"]),
        order: z.enum(["asc", "desc"]),
      }),
    )
    .optional(),
  filters: z
    .object({
      role: z.string().optional(),
    })
    .optional(),
});

export type GetOrganizationMembersInput = z.infer<
  typeof GetOrganizationMembersSchema
>;
