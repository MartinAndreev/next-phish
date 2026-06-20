export {
  loginSchema,
  magicLinkSchema,
  setupSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
} from "./schemas";
export type { LoginInput, SetupInput } from "./schemas";

export { createOrganizationSchema } from "./schemas";
export type { CreateOrganizationInput } from "./schemas";

export {
  emailTemplateStatusSchema,
  createEmailTemplateSchema,
  updateEmailTemplateSchema,
} from "./schemas";
export type {
  CreateEmailTemplateInput,
  UpdateEmailTemplateInput,
} from "./schemas";
