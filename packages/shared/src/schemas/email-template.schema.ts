import { z } from "zod";

export const emailTemplateStatusSchema = z.enum(["DRAFT", "ACTIVE"]);

export const createEmailTemplateSchema = z.object({
  name: z.string().trim().min(1, "Template name is required"),
  tags: z.array(z.string().trim().min(1, "Tag cannot be empty")).default([]),
  html: z.string().min(1, "Template HTML is required"),
  design: z.unknown().default({}),
  status: emailTemplateStatusSchema.default("DRAFT"),
  trackingPixel: z.boolean().default(true),
  fileIds: z.array(z.string()).default([]),
});

export const updateEmailTemplateSchema = createEmailTemplateSchema.extend({
  id: z.string(),
});

export type CreateEmailTemplateInput = z.infer<
  typeof createEmailTemplateSchema
>;
export type UpdateEmailTemplateInput = z.infer<
  typeof updateEmailTemplateSchema
>;
