import { z } from "zod";

export const mailProviderTypeSchema = z.enum([
  "SMTP",
  "MICROSOFT_GRAPH",
  "AWS_SES",
  "SENDGRID",
  "MAILGUN",
  "POSTMARK",
  "RESEND",
  "GENERAL_API",
]);

const sortFieldSchema = z.enum([
  "name",
  "providerType",
  "createdAt",
  "updatedAt",
]);
const sortOrderSchema = z.enum(["asc", "desc"]);

const sortSchema = z.object({
  field: sortFieldSchema,
  order: sortOrderSchema,
});

export const GetMailSendingProfilesSchema = z.object({
  search: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
  sort: z.array(sortSchema).optional(),
});

export const GetMailSendingProfileByIdSchema = z.object({
  id: z.string().min(1),
});

export const CreateMailSendingProfileSchema = z.object({
  name: z.string().trim().min(1, "Profile name is required"),
  providerType: mailProviderTypeSchema,
  fromName: z.string().trim().min(1, "From name is required"),
  fromEmail: z.string().email("From email must be valid"),
  replyToEmail: z.string().email().optional(),
  headers: z.record(z.string()).optional(),
  providerConfig: z.record(z.unknown()),
  isDefault: z.boolean().optional().default(false),
});

export const UpdateMailSendingProfileSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).optional(),
  fromName: z.string().trim().min(1).optional(),
  fromEmail: z.string().email().optional(),
  replyToEmail: z.string().email().optional().nullable(),
  headers: z.record(z.string()).optional().nullable(),
  providerConfig: z.record(z.unknown()).optional(),
  isDefault: z.boolean().optional(),
});

export const DeleteMailSendingProfileSchema = z.object({
  id: z.string().min(1),
});

export const SendTestEmailSchema = z.object({
  profileId: z.string().min(1),
  toEmail: z.string().email("Test recipient email must be valid"),
});

export const VerifyConnectionSchema = z.object({
  profileId: z.string().min(1),
});

export type GetMailSendingProfilesInput = z.infer<
  typeof GetMailSendingProfilesSchema
>;
export type GetMailSendingProfileByIdInput = z.infer<
  typeof GetMailSendingProfileByIdSchema
>;
export type CreateMailSendingProfileInput = z.infer<
  typeof CreateMailSendingProfileSchema
>;
export type UpdateMailSendingProfileInput = z.infer<
  typeof UpdateMailSendingProfileSchema
>;
export type DeleteMailSendingProfileInput = z.infer<
  typeof DeleteMailSendingProfileSchema
>;
export type SendTestEmailInput = z.infer<typeof SendTestEmailSchema>;
export type VerifyConnectionInput = z.infer<typeof VerifyConnectionSchema>;
