"use client";

import { Button } from "primereact/button";
import { FileUploader } from "@/src/components/molecules/file-uploader";
import { useTranslation } from "@/src/lib/i18n";

export interface AttachedFile {
  id: string;
  name: string;
  size: number;
  format: string;
}

interface FileAttachmentPanelProps {
  files: AttachedFile[];
  onUpload: (file: File) => Promise<void>;
  onRemove: (fileId: string) => Promise<void>;
  disabled?: boolean;
}

function formatSize(bytes: number): string {
  if (bytes >= 1_048_576) {
    return `${(bytes / 1_048_576).toFixed(1)} MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${bytes} B`;
}

function formatType(format: string): string {
  const iconMap: Record<string, string> = {
    "application/pdf": "PDF",
    "application/zip": "ZIP",
    "image/png": "PNG",
    "image/jpeg": "JPG",
    "image/gif": "GIF",
    "image/svg+xml": "SVG",
    "application/msword": "DOC",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "DOCX",
    "application/vnd.ms-excel": "XLS",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
  };
  return iconMap[format] ?? format.split("/").pop()?.toUpperCase() ?? format;
}

export function FileAttachmentPanel({
  files,
  onUpload,
  onRemove,
  disabled,
}: FileAttachmentPanelProps) {
  const t = useTranslation();

  return (
    <section className="rounded-2xl border border-[#1C2945] bg-brand-dark p-5 shadow-[0_20px_45px_rgba(2,11,29,0.28)]">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-white">
          {t("emailTemplates.attachments")}
        </h2>
      </div>

      <FileUploader
        onUpload={onUpload}
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip"
        maxFileSize={10000000}
      />

      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <i className="pi pi-file text-zinc-400" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-100">
                    {file.name}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {formatType(file.format)} &middot; {formatSize(file.size)}
                  </p>
                </div>
              </div>
              <Button
                size="small"
                type="button"
                icon="pi pi-trash"
                disabled={disabled}
                onClick={() => onRemove(file.id)}
                className="ml-2 shrink-0 rounded-lg border border-red-500/30 bg-transparent px-2 py-1 text-xs text-red-400 hover:bg-red-500/10"
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
