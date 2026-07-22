import { z } from "zod";
import {
  pagePathSchema,
  pageTypeSchema,
  pageStatusSchema,
} from "@next-phish/shared";

const sortFieldSchema = z.enum([
  "name",
  "type",
  "status",
  "createdAt",
  "updatedAt",
]);
const sortOrderSchema = z.enum(["asc", "desc"]);

const sortSchema = z.object({
  field: sortFieldSchema,
  order: sortOrderSchema,
});

export const GetPagesSchema = z.object({
  search: z.string().optional(),
  selectedId: z.string().optional(),
  includeContent: z.boolean().default(false),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
  sort: z.array(sortSchema).optional(),
  filters: z
    .object({
      status: pageStatusSchema.optional(),
      type: pageTypeSchema.optional(),
    })
    .optional(),
});

const pageBaseSchema = z.object({
  name: z.string().trim().min(1, "Page name is required"),
  path: pagePathSchema.default(null),
  type: pageTypeSchema.default("LANDING"),
  html: z.string().default(""),
  design: z.unknown().default({}),
  status: pageStatusSchema.default("DRAFT"),
  redirectUrl: z.string().nullable().optional(),
  redirectPageId: z.string().nullable().optional(),
});

export const CreatePageCommandSchema = pageBaseSchema;

export const UpdatePageCommandSchema = pageBaseSchema.extend({
  id: z.string(),
});

export const GetPageByIdSchema = z.object({
  id: z.string(),
});

export const DeletePageCommandSchema = z.object({
  id: z.string(),
});

export const ImportPageFromUrlSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  includeAssets: z.boolean().default(false),
});

export type GetPagesInput = z.infer<typeof GetPagesSchema>;
export type CreatePageCommandInput = z.infer<typeof CreatePageCommandSchema>;
export type UpdatePageCommandInput = z.infer<typeof UpdatePageCommandSchema>;
export type GetPageByIdInput = z.infer<typeof GetPageByIdSchema>;
export type DeletePageCommandInput = z.infer<typeof DeletePageCommandSchema>;
export type ImportPageFromUrlInput = z.infer<typeof ImportPageFromUrlSchema>;
