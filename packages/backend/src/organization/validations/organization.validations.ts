import { z } from "zod";

const sortFieldSchema = z.enum(["name", "slug", "createdAt"]);
const sortOrderSchema = z.enum(["asc", "desc"]);

const sortSchema = z.object({
  field: sortFieldSchema,
  order: sortOrderSchema,
});

export const GetUserOrganizationsSchema = z.object({
  search: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
  sort: z.array(sortSchema).optional(),
  filters: z
    .object({
      role: z.string().optional(),
    })
    .optional(),
});

export type GetUserOrganizationsInput = z.infer<
  typeof GetUserOrganizationsSchema
>;

export const CreateOrganizationCommandSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase with hyphens only",
    ),
});

export type CreateOrganizationCommandInput = z.infer<
  typeof CreateOrganizationCommandSchema
>;
