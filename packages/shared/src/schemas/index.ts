export {
  loginSchema,
  magicLinkSchema,
  setupSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
} from "./auth.schema";
export type { LoginInput, SetupInput } from "./auth.schema";

export { createOrganizationSchema } from "./organization.schema";
export type { CreateOrganizationInput } from "./organization.schema";

export {
  emailTemplateStatusSchema,
  createEmailTemplateSchema,
  updateEmailTemplateSchema,
} from "./email-template.schema";
export type {
  CreateEmailTemplateInput,
  UpdateEmailTemplateInput,
} from "./email-template.schema";

export {
  listFilesSchema,
  deleteFileSchema,
  uploadFileSchema,
  filePurposeSchema,
} from "./file.schema";
export type {
  ListFilesInput,
  DeleteFileInput,
  UploadFileInput,
} from "./file.schema";

export {
  pageTypeSchema,
  pageStatusSchema,
  createPageSchema,
  updatePageSchema,
} from "./page.schema";
export type { CreatePageInput, UpdatePageInput } from "./page.schema";

export {
  mcpListSchema,
  mcpIdWithOrgSchema,
  mcpCreateOrganizationSchema,
  mcpDeleteOrganizationSchema,
  mcpCreateEmailTemplateSchema,
  mcpUpdateEmailTemplateSchema,
  mcpCreatePageSchema,
  mcpUpdatePageSchema,
  mcpImportPageFromUrlSchema,
  mcpListFilesSchema,
  mcpGetJobStatusSchema,
} from "./mcp.schema";
