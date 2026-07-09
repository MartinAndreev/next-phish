import { z } from "zod";

export const ResendProviderConfigSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
});

export type ResendProviderConfig = z.infer<typeof ResendProviderConfigSchema>;
