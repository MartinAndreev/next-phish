import { z } from "zod";

export const createOrganizationSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must contain only lowercase letters, numbers, and hyphens",
    ),
});

export const updateOrganizationSchema = createOrganizationSchema;

export const ignoredNetworkSchema = z.object({
  network: z
    .string()
    .trim()
    .min(1, "IP address or network is required")
    .max(64),
  description: z.string().trim().max(200).optional(),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type IgnoredNetworkInput = z.infer<typeof ignoredNetworkSchema>;
