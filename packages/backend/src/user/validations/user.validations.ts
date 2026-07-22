import { z } from "zod";

export const CreateUserSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    email: z
      .string()
      .trim()
      .email("Invalid email")
      .transform((value) => value.toLowerCase()),
    role: z.enum(["admin", "user"]),
    organizationMode: z.enum(["existing", "self"]),
    organizationId: z.string().min(1).optional(),
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

export const ListUsersSchema = z.object({
  search: z.string().trim().optional(),
  limit: z.number().int().min(1).max(100).default(10),
  offset: z.number().int().min(0).default(0),
  sort: z
    .array(
      z.object({
        field: z.enum(["name", "email", "role", "createdAt"]),
        order: z.enum(["asc", "desc"]),
      }),
    )
    .optional(),
  filters: z
    .object({
      role: z.enum(["admin", "user"]).optional(),
      status: z.enum(["active", "disabled", "pending"]).optional(),
    })
    .optional(),
});

export const UserIdSchema = z.object({ userId: z.string().min(1) });
export const SetUserDisabledSchema = UserIdSchema.extend({
  disabled: z.boolean(),
});
export const DeleteUserSchema = UserIdSchema.extend({
  orphanAction: z.enum(["keep", "delete"]),
});
export const SetInitialPasswordSchema = z
  .object({ password: z.string().min(8), confirmPassword: z.string().min(8) })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type ListUsersInput = z.infer<typeof ListUsersSchema>;
export type SetUserDisabledInput = z.infer<typeof SetUserDisabledSchema>;
export type DeleteUserInput = z.infer<typeof DeleteUserSchema>;
export type SetInitialPasswordInput = z.infer<typeof SetInitialPasswordSchema>;

export const GetUserByEmailSchema = z.object({
  email: z.string().email("Invalid email"),
});
export type GetUserByEmailInput = z.infer<typeof GetUserByEmailSchema>;
export const GetUserCountSchema = z.object({});
export type GetUserCountInput = z.infer<typeof GetUserCountSchema>;
