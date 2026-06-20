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
}

export interface CreateEmailTemplateData {
  name: string;
  tags: string[];
  html: string;
  design: unknown;
  status: EmailTemplateStatus;
  organizationId: string;
  createdById: string;
}

export interface UpdateEmailTemplateData {
  name: string;
  tags: string[];
  html: string;
  design: unknown;
  status: EmailTemplateStatus;
}

export interface EmailTemplateListRow {
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

export interface EmailTemplateRow extends EmailTemplateListRow {
  html: string;
  design: unknown;
}
