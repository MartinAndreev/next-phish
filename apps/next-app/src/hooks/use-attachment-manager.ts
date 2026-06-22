"use client";

import { useState } from "react";
import type { AttachedFile } from "@/src/components/organisms/email-templates/file-attachment-panel";

interface UseAttachmentManagerOptions {
  onUploadFile: (
    file: File,
  ) => Promise<{ id: string; name: string; size: number; format: string }>;
  onDeleteFile: (fileId: string) => Promise<void>;
  initialAttachedFiles: AttachedFile[];
}

export function useAttachmentManager({
  onUploadFile,
  onDeleteFile,
  initialAttachedFiles,
}: UseAttachmentManagerOptions) {
  const [uploading, setUploading] = useState(false);
  const [locallyAdded, setLocallyAdded] = useState<AttachedFile[]>([]);
  const [locallyRemovedIds, setLocallyRemovedIds] = useState<Set<string>>(
    new Set(),
  );

  const attachedFiles: AttachedFile[] = [
    ...initialAttachedFiles.filter((f) => !locallyRemovedIds.has(f.id)),
    ...locallyAdded.filter(
      (f) => !initialAttachedFiles.some((e) => e.id === f.id),
    ),
  ];

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const fileView = await onUploadFile(file);
      setLocallyAdded((prev) => [
        ...prev,
        {
          id: fileView.id,
          name: fileView.name,
          size: fileView.size,
          format: fileView.format,
        },
      ]);
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove(fileId: string) {
    await onDeleteFile(fileId);
    setLocallyRemovedIds((prev) => new Set(prev).add(fileId));
  }

  return {
    uploading,
    attachedFiles,
    handleUpload,
    handleRemove,
  };
}
