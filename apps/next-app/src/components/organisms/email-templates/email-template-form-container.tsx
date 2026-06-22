"use client";

import { useState } from "react";
import { Skeleton } from "primereact/skeleton";
import { useEmailTemplateEditor } from "@/src/hooks/use-email-template-editor";
import { EmailTemplateForm } from "./email-template-form";
import type { AttachedFile } from "./file-attachment-panel";

interface EmailTemplateFormContainerProps {
  templateId?: string;
}

export function EmailTemplateFormContainer({
  templateId,
}: EmailTemplateFormContainerProps) {
  const {
    data,
    isLoading,
    notFound,
    initialValues,
    attachedFiles: initialAttachedFiles,
    editorHtmlRef,
    editorDesignRef,
    status,
    handleSubmit,
    handleUploadFile,
    handleDeleteFile,
    breadcrumbItems,
    t,
    router,
  } = useEmailTemplateEditor({ templateId });

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

  const formInitialValues = {
    name: initialValues.name,
    tags: initialValues.tags,
    status: initialValues.status,
    trackingPixel: initialValues.trackingPixel,
  };

  if (templateId && isLoading) {
    return (
      <div className="px-6 py-8">
        <Skeleton width="220px" height="1rem" className="mb-4" />
        <Skeleton width="280px" height="2rem" className="mb-2" />
        <Skeleton width="420px" height="1rem" className="mb-8" />
        <Skeleton width="100%" height="720px" borderRadius="1rem" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-8">
        <p className="text-zinc-400">{t("emailTemplates.notFound")}</p>
      </div>
    );
  }

  async function handleFormSubmit(values: {
    name: string;
    tags: string[];
    status: "DRAFT" | "ACTIVE";
    trackingPixel: boolean;
  }) {
    await handleSubmit({
      ...values,
      fileIds: attachedFiles.map((f) => f.id),
    });
  }

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const fileView = await handleUploadFile(file);
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
    await handleDeleteFile(fileId);
    setLocallyRemovedIds((prev) => new Set(prev).add(fileId));
  }

  return (
    <EmailTemplateForm
      templateId={templateId}
      initialValues={formInitialValues}
      attachedFiles={attachedFiles}
      uploading={uploading}
      status={status}
      breadcrumbItems={breadcrumbItems}
      editorHtmlRef={editorHtmlRef}
      editorDesignRef={editorDesignRef}
      initialDesign={data?.design}
      t={t}
      onUpload={handleUpload}
      onRemove={handleRemove}
      onSubmit={handleFormSubmit}
      onCancel={() => router.push("/email-templates")}
    />
  );
}
