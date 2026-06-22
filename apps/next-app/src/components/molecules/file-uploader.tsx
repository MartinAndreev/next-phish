"use client";

import { useMemo } from "react";
import { FileUpload, type FileUploadHandlerEvent } from "primereact/fileupload";
import { useTranslation } from "@/src/lib/i18n";

interface FileUploaderProps {
  onUpload: (file: File) => Promise<void>;
  accept?: string;
  maxFileSize?: number;
}

export function FileUploader({
  onUpload,
  accept,
  maxFileSize,
}: FileUploaderProps) {
  const t = useTranslation();

  const emptyTemplate = useMemo(
    () => (
      <p className="m-0 text-sm text-zinc-400">
        {t("emailTemplates.dragDropHint")}
      </p>
    ),
    [t],
  );

  async function handleUpload(event: FileUploadHandlerEvent) {
    const promises = event.files.map((file) => onUpload(file));
    await Promise.all(promises);
    event.options.clear();
  }

  return (
    <FileUpload
      mode="advanced"
      customUpload
      auto
      multiple
      uploadHandler={handleUpload}
      accept={accept}
      maxFileSize={maxFileSize}
      chooseLabel={t("emailTemplates.uploadFile")}
      className="w-full"
      emptyTemplate={emptyTemplate}
    />
  );
}
