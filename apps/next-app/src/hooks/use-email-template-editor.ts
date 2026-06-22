"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { trpc } from "@/src/lib/trpc";
import { useTranslation } from "@/src/lib/i18n";
import { useFormStatus } from "@/src/hooks/use-form-status";
import type { AttachedFile } from "@/src/components/organisms/email-templates/file-attachment-panel";

interface UseEmailTemplateEditorOptions {
  templateId?: string;
}

export function useEmailTemplateEditor({
  templateId,
}: UseEmailTemplateEditorOptions = {}) {
  const t = useTranslation();
  const router = useRouter();
  const utils = trpc.useUtils();
  const { status, setError, setSuccess, reset } = useFormStatus();
  const editorHtmlRef = useRef("");
  const editorDesignRef = useRef<unknown>(null);

  const { data, isLoading } = trpc.emailTemplate.getById.useQuery(
    { id: templateId ?? "" },
    { enabled: Boolean(templateId) },
  );

  const { data: fileViews, isLoading: isLoadingFiles } =
    trpc.file.list.useQuery(
      { emailTemplateId: templateId ?? "" },
      { enabled: Boolean(templateId) },
    );

  const createMutation = trpc.emailTemplate.create.useMutation({
    onSuccess: async (template) => {
      await utils.emailTemplate.list.invalidate();
      router.push(`/email-templates/${template.id}`);
      setSuccess(t("emailTemplates.saveTemplate"));
    },
  });

  const updateMutation = trpc.emailTemplate.update.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.emailTemplate.list.invalidate(),
        templateId
          ? utils.emailTemplate.getById.invalidate({ id: templateId })
          : Promise.resolve(),
      ]);
      setSuccess(t("emailTemplates.updateTemplate"));
    },
  });

  const uploadFileMutation = trpc.file.uploadFile.useMutation();
  const deleteFileMutation = trpc.file.delete.useMutation();

  useEffect(() => {
    if (!data) {
      return;
    }

    editorHtmlRef.current = data.html;
    editorDesignRef.current = data.design;
  }, [data]);

  async function handleUploadFile(file: File) {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 =
      typeof btoa === "function"
        ? btoa(binary)
        : Buffer.from(binary).toString("base64");

    const result = await uploadFileMutation.mutateAsync({
      name: file.name,
      size: file.size,
      format: file.type,
      purpose: "EMAIL_ATTACHMENT",
      data: base64,
    });

    return result;
  }

  async function handleDeleteFile(fileId: string) {
    await deleteFileMutation.mutateAsync({ id: fileId });
  }

  async function handleSubmit(values: {
    name: string;
    tags: string[];
    status: "DRAFT" | "ACTIVE";
    trackingPixel: boolean;
    fileIds: string[];
  }) {
    reset();

    if (!editorHtmlRef.current) {
      setError(
        templateId
          ? t("emailTemplates.updateError")
          : t("emailTemplates.createError"),
      );
      return;
    }

    const payload = {
      name: values.name.trim(),
      tags: values.tags.flatMap((tag) => {
        const normalizedTag = tag.trim();
        return normalizedTag ? [normalizedTag] : [];
      }),
      html: editorHtmlRef.current,
      design: editorDesignRef.current,
      status: values.status,
      trackingPixel: values.trackingPixel,
      fileIds: values.fileIds,
    };

    try {
      if (templateId) {
        await updateMutation.mutateAsync({ id: templateId, ...payload });
        return;
      }

      await createMutation.mutateAsync(payload);
    } catch (error) {
      const fallback = templateId
        ? t("emailTemplates.updateError")
        : t("emailTemplates.createError");
      setError(error instanceof Error ? error.message : fallback);
    }
  }

  const initialValues = data
    ? {
        name: data.name,
        tags: data.tags,
        status: data.status,
        trackingPixel: data.trackingPixel,
        fileIds: data.fileIds,
      }
    : {
        name: "",
        tags: [] as string[],
        status: "DRAFT" as const,
        trackingPixel: true,
        fileIds: [] as string[],
      };

  const attachedFiles: AttachedFile[] =
    fileViews?.map((f) => ({
      id: f.id,
      name: f.name,
      size: f.size,
      format: f.format,
    })) ?? [];

  const notFound = Boolean(templateId && !isLoading && !data);

  const breadcrumbItems = [
    { label: t("emailTemplates.title"), url: "/email-templates" },
    {
      label: templateId
        ? t("emailTemplates.editTemplate")
        : t("emailTemplates.createTitle"),
    },
  ];

  return {
    data,
    isLoading,
    isLoadingFiles,
    notFound,
    initialValues,
    attachedFiles,
    editorHtmlRef,
    editorDesignRef,
    createMutation,
    updateMutation,
    uploadFileMutation,
    deleteFileMutation,
    status,
    setError,
    setSuccess,
    reset,
    handleSubmit,
    handleUploadFile,
    handleDeleteFile,
    breadcrumbItems,
    t,
    router,
    utils,
  };
}
