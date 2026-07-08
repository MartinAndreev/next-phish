import { z } from "zod";

export const PostmarkProviderConfigSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
});

export type PostmarkProviderConfig = z.infer<
  typeof PostmarkProviderConfigSchema
>;
