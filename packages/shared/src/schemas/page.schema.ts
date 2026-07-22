import { z } from "zod";

export const pageTypeSchema = z.enum(["LANDING", "REDIRECT"]);

export const pageStatusSchema = z.enum(["DRAFT", "ACTIVE"]);

const reservedPublicPaths = new Set([
  "a",
  "c",
  "health",
  "imports",
  "p.gif",
  "r",
  "s",
]);

export const pagePathSchema = z
  .string()
  .trim()
  .max(120, "Page path must be 120 characters or fewer")
  .transform((value) => value.replace(/^\/+|\/+$/g, "").toLowerCase())
  .refine(
    (value) =>
      !value || /^[a-z0-9][a-z0-9._~-]*(\/[a-z0-9][a-z0-9._~-]*)*$/.test(value),
    "Use URL-safe path segments such as login or account/verify",
  )
  .refine(
    (value) => !value || !reservedPublicPaths.has(value.split("/")[0]!),
    "This path is reserved by the public content server",
  )
  .transform((value) => value || null)
  .nullable()
  .optional();

export const createPageSchema = z.object({
  name: z.string().trim().min(1, "Page name is required"),
  path: pagePathSchema.default(null),
  type: pageTypeSchema.default("LANDING"),
  html: z.string().default(""),
  design: z.unknown().default({}),
  status: pageStatusSchema.default("DRAFT"),
  redirectUrl: z.string().nullable().optional(),
  redirectPageId: z.string().nullable().optional(),
});

export const updatePageSchema = createPageSchema.extend({
  id: z.string(),
});

export type CreatePageInput = z.infer<typeof createPageSchema>;
export type UpdatePageInput = z.infer<typeof updatePageSchema>;
