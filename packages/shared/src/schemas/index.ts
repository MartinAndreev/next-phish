export {
  loginSchema,
  magicLinkSchema,
  setupSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
} from "./auth.schema";
export type { LoginInput, SetupInput } from "./auth.schema";

export { createOrganizationSchema } from "./organization.schema";
export type { CreateOrganizationInput } from "./organization.schema";
