import { z } from "zod";

export const pageTypeSchema = z.enum(["LANDING", "REDIRECT"]);

export const pageStatusSchema = z.enum(["DRAFT", "ACTIVE"]);

export const createPageSchema = z.object({
  name: z.string().trim().min(1, "Page name is required"),
  type: pageTypeSchema.default("LANDING"),
  html: z.string().default(""),
  design: z.unknown().nullable(),
  status: pageStatusSchema.default("DRAFT"),
  captureData: z.boolean().default(false),
  redirectUrl: z.string().nullable().optional(),
  redirectPageId: z.string().nullable().optional(),
});

export const updatePageSchema = createPageSchema.extend({
  id: z.string(),
});

export type CreatePageInput = z.infer<typeof createPageSchema>;
export type UpdatePageInput = z.infer<typeof updatePageSchema>;
