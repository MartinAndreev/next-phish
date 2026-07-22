import { z } from "zod";

export const adminCreateUserSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    email: z.string().trim().email("Enter a valid email address"),
    role: z.enum(["admin", "user"]),
    organizationMode: z.enum(["existing", "self"]),
    organizationId: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.organizationMode === "existing" && !value.organizationId) {
      ctx.addIssue({
        code: "custom",
        path: ["organizationId"],
        message: "Select an organization",
      });
    }
  });

export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>;

export const welcomeUserPayloadSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  magicLink: z.string().url(),
});

export type WelcomeUserPayload = z.infer<typeof welcomeUserPayloadSchema>;
