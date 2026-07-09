import { z } from "zod";

export const GeneralApiProviderConfigSchema = z
  .object({
    apiKey: z.string().min(1, "API key is required"),
    sendEndpoint: z.string().url("Send endpoint must be a valid URL"),
    authMethod: z.enum(["bearer", "header"]),
    authHeaderName: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.authMethod === "header" && !data.authHeaderName) {
        return false;
      }
      return true;
    },
    {
      message: "authHeaderName is required when authMethod is 'header'",
      path: ["authHeaderName"],
    },
  );

export type GeneralApiProviderConfig = z.infer<
  typeof GeneralApiProviderConfigSchema
>;
