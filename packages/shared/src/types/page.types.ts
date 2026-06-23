export type PageType = "LANDING" | "REDIRECT";
export type PageStatus = "DRAFT" | "ACTIVE";

export interface PageAuthorView {
  id: string;
  name: string;
  email: string;
}

export interface PageListItemView {
  id: string;
  name: string;
  type: PageType;
  status: PageStatus;
  organizationId: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: PageAuthorView;
}

export interface PageView extends PageListItemView {
  html: string;
  design: unknown;
  captureData: boolean;
  redirectUrl: string | null;
  redirectPageId: string | null;
}

export interface CreatePageData {
  name: string;
  type: PageType;
  html: string;
  design: unknown;
  status: PageStatus;
  captureData: boolean;
  redirectUrl: string | null;
  redirectPageId: string | null;
  organizationId: string;
  createdById: string;
}

export interface UpdatePageData {
  name: string;
  type: PageType;
  html: string;
  design: unknown;
  status: PageStatus;
  captureData: boolean;
  redirectUrl: string | null;
  redirectPageId: string | null;
}

export interface CreatePageSubmissionData {
  pageId: string;
  data: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
}
