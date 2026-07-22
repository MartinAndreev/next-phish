export type PageType = "LANDING" | "REDIRECT";
import type { CatalogPreviewView } from "./email-template.types";

export type PageStatus = "DRAFT" | "ACTIVE";

export interface PageAuthorView {
  id: string;
  name: string;
  email: string;
}

export interface PageListItemView {
  id: string;
  name: string;
  path: string | null;
  type: PageType;
  status: PageStatus;
  organizationId: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  contentRevision: number;
  /** Included by catalog picker queries for a sandboxed live-preview fallback. */
  html?: string;
  preview: CatalogPreviewView | null;
  createdBy: PageAuthorView;
}

export interface PageView extends PageListItemView {
  html: string;
  design: unknown;
  redirectUrl: string | null;
  redirectPageId: string | null;
}

export interface CreatePageData {
  name: string;
  path: string | null;
  type: PageType;
  html: string;
  design: unknown;
  status: PageStatus;
  redirectUrl: string | null;
  redirectPageId: string | null;
  organizationId: string;
  createdById: string;
}

export interface UpdatePageData {
  name: string;
  path: string | null;
  type: PageType;
  html: string;
  design: unknown;
  status: PageStatus;
  redirectUrl: string | null;
  redirectPageId: string | null;
}
