import { z } from "zod";

export const MailgunProviderConfigSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  domain: z.string().min(1, "Domain is required"),
  endpoint: z.string().url().optional(),
});

export type MailgunProviderConfig = z.infer<typeof MailgunProviderConfigSchema>;
