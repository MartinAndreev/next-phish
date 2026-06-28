import { z } from "zod";

export const CreateSiteImportSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  includeAssets: z.boolean().default(false),
});

export const GetSiteImportByJobIdSchema = z.object({
  jobId: z.string(),
});

export type CreateSiteImportInput = z.infer<typeof CreateSiteImportSchema>;
export type GetSiteImportByJobIdInput = z.infer<
  typeof GetSiteImportByJobIdSchema
>;
