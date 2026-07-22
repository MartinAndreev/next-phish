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

export {
  createOrganizationSchema,
  updateOrganizationSchema,
  ignoredNetworkSchema,
} from "./organization.schema";
export type {
  CreateOrganizationInput,
  UpdateOrganizationInput,
  IgnoredNetworkInput,
} from "./organization.schema";

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
  pagePathSchema,
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
  mcpCreateSendingProfileSchema,
  mcpUpdateSendingProfileSchema,
  mcpCreateTargetGroupSchema,
  mcpListTasksSchema,
  mcpCreateTaskSchema,
  mcpUpdateTaskSchema,
  mcpMoveTaskSchema,
  mcpCreateTaskStatusSchema,
  mcpUpdateTaskStatusSchema,
  mcpReorderTaskStatusesSchema,
  mcpDeleteTaskStatusSchema,
} from "./mcp.schema";

export {
  targetGroupStatusSchema,
  targetGroupUserSchema,
  createTargetGroupSchema,
  updateTargetGroupSchema,
  importTargetGroupUsersSchema,
} from "./target-group.schema";
export type {
  CreateTargetGroupInput,
  UpdateTargetGroupInput,
  ImportTargetGroupUsersInput,
  TargetGroupUserInput,
} from "./target-group.schema";

export { sendingProfileFormSchema } from "./sending-profile.schema";

export { campaignFormSchema, scheduleFormSchema } from "./campaign.schema";
export type { CampaignFormValues, ScheduleFormValues } from "./campaign.schema";

export {
  taskPrioritySchema,
  taskStatusColorSchema,
  taskResourceTypeSchema,
  taskRelationSchema,
  taskFormSchema,
  taskStatusFormSchema,
} from "./task.schema";
export type {
  TaskFormValues,
  TaskStatusFormValues,
  TaskResourceType,
} from "./task.schema";
export type { SendingProfileFormValues } from "./sending-profile.schema";

export { adminCreateUserSchema, welcomeUserPayloadSchema } from "./user.schema";
export type { AdminCreateUserInput, WelcomeUserPayload } from "./user.schema";

export {
  campaignEventTypeSchema,
  deliveryEventTypeSchema,
  recipientDeliveryStatusSchema,
  negativeEventSeveritySchema,
  materializeOccurrencePayloadSchema,
  feedDeliveriesPayloadSchema,
  deliverRecipientPayloadSchema,
  processDeliveryEventPayloadSchema,
  processTrackingEventPayloadSchema,
  executionQueuePayloadSchema,
} from "./execution.schema";
export type {
  CampaignEventType,
  DeliveryEventType,
  RecipientDeliveryStatus,
  NegativeEventSeverity,
  ExecutionQueuePayload,
} from "./execution.schema";
