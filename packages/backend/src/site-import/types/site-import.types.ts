import type { ImportStatus } from "@prisma/client";

export type { ImportStatus };

export interface SiteImportView {
  id: string;
  jobId: string;
  url: string;
  finalUrl: string | null;
  status: ImportStatus;
  includeAssets: boolean;
  html: string | null;
  assetDiscovered: number;
  assetDownloaded: number;
  assetFailed: number;
  assetSkipped: number;
  organizationId: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SiteImportFileView {
  id: string;
  siteImportId: string;
  fileId: string;
  originalUrl: string;
  resolvedUrl: string;
  localPath: string;
  contentHash: string | null;
  downloadStatus: string;
  createdAt: Date;
}

export interface CreateSiteImportData {
  jobId: string;
  url: string;
  includeAssets: boolean;
  organizationId: string;
  createdById: string;
}

export interface UpdateSiteImportData {
  finalUrl?: string;
  status?: ImportStatus;
  html?: string;
  assetDiscovered?: number;
  assetDownloaded?: number;
  assetFailed?: number;
  assetSkipped?: number;
}

export interface CreateSiteImportFileData {
  siteImportId: string;
  fileId: string;
  originalUrl: string;
  resolvedUrl: string;
  localPath: string;
  contentHash?: string;
  downloadStatus: string;
}

export interface AssetCandidate {
  originalUrl: string;
  resolvedUrl: string;
  attribute: string;
  elementIndex: number;
}

export interface DownloadedAsset {
  candidate: AssetCandidate;
  siteImportFileId: string;
  remoteId: string;
  localPath: string;
  contentHash: string;
  size: number;
  contentType: string;
}

export interface ImportContext {
  siteImportId: string;
  organizationId: string;
  createdById: string;
  url: string;
  finalUrl?: string;
  includeAssets: boolean;
  html?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  $: any;
  assetCandidates: AssetCandidate[];
  downloadedAssets: DownloadedAsset[];
  rewrittenHtml?: string;
  stats: {
    discovered: number;
    downloaded: number;
    failed: number;
    skipped: number;
  };
  warnings: string[];
}

export interface ImportHandler {
  handle(ctx: ImportContext, next: () => Promise<void>): Promise<void>;
}
