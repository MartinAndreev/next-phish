import { z } from "zod";

export const MicrosoftGraphProviderConfigSchema = z
  .object({
    tenantId: z.string().min(1, "Tenant ID is required"),
    clientId: z.string().min(1, "Client ID is required"),
    clientSecret: z.string().min(1).optional(),
    certificate: z.string().optional(),
    senderMailbox: z.string().email("Sender mailbox must be a valid email"),
  })
  .refine((data) => data.clientSecret || data.certificate, {
    message: "Either clientSecret or certificate must be provided",
    path: ["clientSecret"],
  });

export type MicrosoftGraphProviderConfig = z.infer<
  typeof MicrosoftGraphProviderConfigSchema
>;
