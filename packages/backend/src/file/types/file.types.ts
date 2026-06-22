import type { FilePurpose } from "@prisma/client";

export type { FilePurpose };

export interface FileView {
  id: string;
  remoteId: string;
  name: string;
  size: number;
  format: string;
  purpose: FilePurpose;
  uploadedById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UploadFileData {
  remoteId: string;
  name: string;
  size: number;
  format: string;
  purpose: FilePurpose;
  uploadedById: string;
  body: string; // base64-encoded
}

export interface CreateFileRowData {
  remoteId: string;
  name: string;
  size: number;
  format: string;
  purpose: FilePurpose;
  uploadedById: string;
}
