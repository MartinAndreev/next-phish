import { z } from "zod";

export const emailTemplateStatusSchema = z.enum(["DRAFT", "ACTIVE"]);

const sortFieldSchema = z.enum(["name", "status", "createdAt", "updatedAt"]);
const sortOrderSchema = z.enum(["asc", "desc"]);

const sortSchema = z.object({
  field: sortFieldSchema,
  order: sortOrderSchema,
});

export const GetEmailTemplatesSchema = z.object({
  search: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
  sort: z.array(sortSchema).optional(),
  filters: z
    .object({
      status: emailTemplateStatusSchema.optional(),
    })
    .optional(),
});

const emailTemplateBaseSchema = z.object({
  name: z.string().trim().min(1, "Template name is required"),
  tags: z.array(z.string().trim().min(1, "Tag cannot be empty")).default([]),
  html: z.string().min(1, "Template HTML is required"),
  design: z.unknown(),
  status: emailTemplateStatusSchema.default("DRAFT"),
  trackingPixel: z.boolean().default(true),
  fileIds: z.array(z.string()).default([]),
});

export const CreateEmailTemplateCommandSchema = emailTemplateBaseSchema;

export const UpdateEmailTemplateCommandSchema = emailTemplateBaseSchema.extend({
  id: z.string(),
});

export const GetEmailTemplateByIdSchema = z.object({
  id: z.string(),
});

export const DeleteEmailTemplateCommandSchema = z.object({
  id: z.string(),
});

export type GetEmailTemplatesInput = z.infer<typeof GetEmailTemplatesSchema>;
export type CreateEmailTemplateCommandInput = z.infer<
  typeof CreateEmailTemplateCommandSchema
>;
export type UpdateEmailTemplateCommandInput = z.infer<
  typeof UpdateEmailTemplateCommandSchema
>;
export type GetEmailTemplateByIdInput = z.infer<
  typeof GetEmailTemplateByIdSchema
>;
export type DeleteEmailTemplateCommandInput = z.infer<
  typeof DeleteEmailTemplateCommandSchema
>;
