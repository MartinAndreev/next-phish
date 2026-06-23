"use client";

import { FormSkeleton } from "@/src/components/atoms/form-skeleton";
import { useEmailTemplateEditor } from "@/src/hooks/use-email-template-editor";
import { useAttachmentManager } from "@/src/hooks/use-attachment-manager";
import { EmailTemplateForm } from "./email-template-form";

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

  const { uploading, attachedFiles, handleUpload, handleRemove } =
    useAttachmentManager({
      onUploadFile: handleUploadFile,
      onDeleteFile: handleDeleteFile,
      initialAttachedFiles,
    });

  const formInitialValues = {
    name: initialValues.name,
    tags: initialValues.tags,
    status: initialValues.status,
    trackingPixel: initialValues.trackingPixel,
  };

  if (templateId && isLoading) {
    return <FormSkeleton />;
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
