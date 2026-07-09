import { z } from "zod";

export const SMTPProviderConfigSchema = z.object({
  host: z.string().min(1, "SMTP host is required"),
  port: z.number().int().min(1).max(65535).optional(),
  secure: z.boolean().default(false),
  username: z.string().optional(),
  password: z.string().optional(),
  ignoreCertErrors: z.boolean().default(false),
  requireTls: z.boolean().default(false),
});

export type SMTPProviderConfig = z.infer<typeof SMTPProviderConfigSchema>;
