export type EmailTemplateStatus = "DRAFT" | "ACTIVE";

export interface CatalogPreviewView {
  id: string;
  status: "MISSING" | "PENDING" | "READY" | "FAILED" | "STALE";
  sourceRevision: number;
  url: string | null;
}

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
  contentRevision: number;
  /** Included by catalog picker queries for a sandboxed live-preview fallback. */
  html?: string;
  preview: CatalogPreviewView | null;
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
