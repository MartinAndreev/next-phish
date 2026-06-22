import { z } from "zod";

export const filePurposeSchema = z.enum([
  "EMAIL_ATTACHMENT",
  "IMPORT",
  "EXPORT",
]);

export const listFilesSchema = z.object({
  purpose: filePurposeSchema.optional(),
  emailTemplateId: z.string().optional(),
});

export const deleteFileSchema = z.object({
  id: z.string(),
});

export const uploadFileSchema = z.object({
  name: z.string().min(1),
  size: z.number().int().positive(),
  format: z.string().min(1),
  purpose: filePurposeSchema.default("EMAIL_ATTACHMENT"),
  data: z.string().min(1),
});

export type ListFilesInput = z.infer<typeof listFilesSchema>;
export type DeleteFileInput = z.infer<typeof deleteFileSchema>;
export type UploadFileInput = z.infer<typeof uploadFileSchema>;
