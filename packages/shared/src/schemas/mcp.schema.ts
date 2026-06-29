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
  type: pageTypeSchema.optional(),
  html: z.string().optional(),
  status: pageStatusSchema.optional(),
  captureData: z.boolean().optional(),
  redirectUrl: z.string().optional(),
});

export const mcpUpdatePageSchema = z.object({
  id: z.string(),
  organizationId,
  name: z.string().optional(),
  type: pageTypeSchema.optional(),
  html: z.string().optional(),
  status: pageStatusSchema.optional(),
  captureData: z.boolean().optional(),
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
