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
