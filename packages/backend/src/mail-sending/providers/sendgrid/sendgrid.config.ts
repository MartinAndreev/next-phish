import { z } from "zod";

export const SendGridProviderConfigSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  endpoint: z.string().url().optional(),
});

export type SendGridProviderConfig = z.infer<
  typeof SendGridProviderConfigSchema
>;
