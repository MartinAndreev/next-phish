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

export {
  listFilesSchema,
  deleteFileSchema,
  uploadFileSchema,
  filePurposeSchema,
} from "./schemas";
export type {
  ListFilesInput,
  DeleteFileInput,
  UploadFileInput,
} from "./schemas";

export {
  pageTypeSchema,
  pageStatusSchema,
  createPageSchema,
  updatePageSchema,
} from "./schemas";
export type { CreatePageInput, UpdatePageInput } from "./schemas";

export type {
  PageType,
  PageStatus,
  PageAuthorView,
  PageListItemView,
  PageView,
  CreatePageData,
  UpdatePageData,
  CreatePageSubmissionData,
} from "./types";

export type {
  EmailTemplateStatus,
  EmailTemplateAuthorView,
  EmailTemplateListItemView,
  EmailTemplateView,
  CreateEmailTemplateData,
  UpdateEmailTemplateData,
} from "./types";

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
  mcpCreateSendingProfileSchema,
  mcpUpdateSendingProfileSchema,
} from "./schemas";

export {
  targetGroupStatusSchema,
  targetGroupUserSchema,
  createTargetGroupSchema,
  updateTargetGroupSchema,
  importTargetGroupUsersSchema,
} from "./schemas";
export type {
  CreateTargetGroupInput,
  UpdateTargetGroupInput,
  ImportTargetGroupUsersInput,
  TargetGroupUserInput,
} from "./schemas";

export type {
  TargetGroupStatus,
  TargetGroupUserView,
  TargetGroupAuthorView,
  TargetGroupListItemView,
  TargetGroupView,
  CreateTargetGroupData,
  UpdateTargetGroupData,
} from "./types";

export { MAIL_PROVIDER_TYPES } from "./types";
export type { MailProviderType } from "./types";

export { sendingProfileFormSchema } from "./schemas";
export type { SendingProfileFormValues } from "./schemas";

export {
  PERMISSION_GROUPS,
  toBetterAuthStatements,
  toRouterPermissions,
  TIME_WINDOW_OPTIONS,
} from "./constants";
export type {
  PermissionGroup,
  PermissionResource,
  TimeWindowOption,
} from "./constants";
