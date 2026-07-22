import { z } from "zod";
import { createOrganizationSchema } from "./organization.schema";
import {
  createEmailTemplateSchema,
  emailTemplateStatusSchema,
} from "./email-template.schema";
import {
  createPageSchema,
  pageTypeSchema,
  pageStatusSchema,
} from "./page.schema";
import { listFilesSchema } from "./file.schema";
import { createTargetGroupSchema } from "./target-group.schema";
import { taskFormSchema, taskStatusFormSchema } from "./task.schema";

const organizationId = z.string().describe("The organization ID.");

export const mcpListSchema = z.object({
  organizationId,
  search: z.string().optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
});

export const mcpIdWithOrgSchema = z.object({
  id: z.string(),
  organizationId,
});

export const mcpCreateOrganizationSchema = createOrganizationSchema;

export const mcpDeleteOrganizationSchema = z.object({
  organizationId,
});

export const mcpCreateEmailTemplateSchema = z.object({
  organizationId,
  name: createEmailTemplateSchema.shape.name,
  html: createEmailTemplateSchema.shape.html,
  tags: createEmailTemplateSchema.shape.tags.optional(),
  status: emailTemplateStatusSchema.optional(),
  trackingPixel: z.boolean().optional(),
  fileIds: z.array(z.string()).optional(),
});

export const mcpUpdateEmailTemplateSchema = z.object({
  id: z.string(),
  organizationId,
  name: z.string().optional(),
  html: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: emailTemplateStatusSchema.optional(),
  trackingPixel: z.boolean().optional(),
  fileIds: z.array(z.string()).optional(),
});

export const mcpCreatePageSchema = z.object({
  organizationId,
  name: createPageSchema.shape.name,
  path: createPageSchema.shape.path.optional(),
  type: pageTypeSchema.optional(),
  html: z.string().optional(),
  status: pageStatusSchema.optional(),
  redirectUrl: z.string().optional(),
});

export const mcpUpdatePageSchema = z.object({
  id: z.string(),
  organizationId,
  name: z.string().optional(),
  path: createPageSchema.shape.path.optional(),
  type: pageTypeSchema.optional(),
  html: z.string().optional(),
  status: pageStatusSchema.optional(),
  redirectUrl: z.string().optional(),
});

export const mcpImportPageFromUrlSchema = z.object({
  organizationId,
  url: z.string().url(),
  includeAssets: z.boolean().optional(),
});

export const mcpListFilesSchema = listFilesSchema.extend({
  organizationId,
});

export const mcpGetJobStatusSchema = z.object({
  jobId: z.string(),
});

export const mcpCreateSendingProfileSchema = z.object({
  organizationId,
  name: z.string().trim().min(1),
  providerType: z.enum([
    "SMTP",
    "MICROSOFT_GRAPH",
    "AWS_SES",
    "SENDGRID",
    "MAILGUN",
    "POSTMARK",
    "RESEND",
    "GENERAL_API",
  ]),
  fromName: z.string().trim().min(1),
  fromEmail: z.string().email(),
  replyToEmail: z.string().email().optional(),
  headers: z.record(z.string()).optional(),
  providerConfig: z.record(z.unknown()),
  isDefault: z.boolean().optional(),
});

export const mcpUpdateSendingProfileSchema = z.object({
  id: z.string(),
  organizationId,
  name: z.string().trim().min(1).optional(),
  fromName: z.string().trim().min(1).optional(),
  fromEmail: z.string().email().optional(),
  replyToEmail: z.string().email().optional().nullable(),
  headers: z.record(z.string()).optional().nullable(),
  providerConfig: z.record(z.unknown()).optional(),
  isDefault: z.boolean().optional(),
});

export const mcpCreateTargetGroupSchema = createTargetGroupSchema.extend({
  organizationId,
});

export const mcpListTasksSchema = z.object({
  organizationId,
  statusIds: z.array(z.string()).optional(),
  assigneeId: z.string().optional(),
  search: z.string().optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
});

export const mcpCreateTaskSchema = taskFormSchema.extend({ organizationId });
export const mcpUpdateTaskSchema = taskFormSchema.partial().extend({
  id: z.string(),
  organizationId,
});
export const mcpMoveTaskSchema = z.object({
  id: z.string(),
  organizationId,
  statusId: z.string(),
});
export const mcpCreateTaskStatusSchema = taskStatusFormSchema.extend({
  organizationId,
});
export const mcpUpdateTaskStatusSchema = taskStatusFormSchema.partial().extend({
  id: z.string(),
  organizationId,
});
export const mcpReorderTaskStatusesSchema = z.object({
  organizationId,
  statusIds: z.array(z.string()).min(1),
});
export const mcpDeleteTaskStatusSchema = z.object({
  id: z.string(),
  organizationId,
  replacementStatusId: z.string().optional(),
});
