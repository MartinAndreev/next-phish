export type EmailTemplateStatus = "DRAFT" | "ACTIVE";

export interface EmailTemplateAuthorView {
  id: string;
  name: string;
  email: string;
}

export interface EmailTemplateListItemView {
  id: string;
  name: string;
  tags: string[];
  status: EmailTemplateStatus;
  organizationId: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: EmailTemplateAuthorView;
}

export interface EmailTemplateView extends EmailTemplateListItemView {
  html: string;
  design: unknown;
  trackingPixel: boolean;
  fileIds: string[];
}

export interface CreateEmailTemplateData {
  name: string;
  tags: string[];
  html: string;
  design: unknown;
  status: EmailTemplateStatus;
  trackingPixel: boolean;
  fileIds: string[];
  organizationId: string;
  createdById: string;
}

export interface UpdateEmailTemplateData {
  name: string;
  tags: string[];
  html: string;
  design: unknown;
  status: EmailTemplateStatus;
  trackingPixel: boolean;
  fileIds: string[];
}
