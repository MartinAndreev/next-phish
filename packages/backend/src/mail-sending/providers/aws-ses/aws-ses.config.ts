import { z } from "zod";

export const AwsSesProviderConfigSchema = z.object({
  region: z.string().min(1, "Region is required"),
  accessKeyId: z.string().min(1, "Access key ID is required"),
  secretAccessKey: z.string().min(1, "Secret access key is required"),
  configurationSet: z.string().optional(),
});

export type AwsSesProviderConfig = z.infer<typeof AwsSesProviderConfigSchema>;
