import { z } from "zod";

export const CreateUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export const GetUserByEmailSchema = z.object({
  email: z.string().email("Invalid email"),
});

export type GetUserByEmailInput = z.infer<typeof GetUserByEmailSchema>;

export const GetUserCountSchema = z.object({});

export type GetUserCountInput = z.infer<typeof GetUserCountSchema>;
