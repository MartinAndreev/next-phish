"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { trpc } from "@/src/lib/trpc";
import { useTranslation } from "@/src/lib/i18n";
import { useFormStatus } from "@/src/hooks/use-form-status";
import { createCatalogPreview } from "@/src/lib/catalog-preview";

interface UsePageEditorOptions {
  pageId?: string;
}

export function usePageEditor({ pageId }: UsePageEditorOptions = {}) {
  const t = useTranslation();
  const router = useRouter();
  const utils = trpc.useUtils();
  const { status, setError, setSuccess, reset } = useFormStatus();
  const editorHtmlRef = useRef("");
  const editorDesignRef = useRef<unknown>(null);

  const { data, isLoading } = trpc.page.getById.useQuery(
    { id: pageId ?? "" },
    { enabled: Boolean(pageId) },
  );

  const createMutation = trpc.page.create.useMutation({
    onSuccess: async () => {
      await utils.page.list.invalidate();
      setSuccess(t("pages.createSuccess"));
    },
  });

  const updateMutation = trpc.page.update.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.page.list.invalidate(),
        pageId
          ? utils.page.getById.invalidate({ id: pageId })
          : Promise.resolve(),
      ]);
      setSuccess(t("pages.updateSuccess"));
    },
  });

  const previewMutation = trpc.page.uploadPreview.useMutation();

  useEffect(() => {
    if (!data) {
      return;
    }

    editorHtmlRef.current = data.html;
    editorDesignRef.current = data.design;
  }, [data]);

  async function handleSubmit(values: {
    name: string;
    path: string | null;
    type: "LANDING" | "REDIRECT";
    status: "DRAFT" | "ACTIVE";
    captureData: boolean;
    redirectUrl: string | null;
    redirectPageId: string | null;
  }) {
    reset();

    const payload = {
      name: values.name.trim(),
      path: values.path,
      type: values.type,
      html: editorHtmlRef.current,
      design: editorDesignRef.current,
      status: values.status,
      captureData: values.captureData,
      redirectUrl: values.redirectUrl ?? null,
      redirectPageId: values.redirectPageId ?? null,
    };

    try {
      const saved = pageId
        ? await updateMutation.mutateAsync({ id: pageId, ...payload })
        : await createMutation.mutateAsync(payload);
      try {
        await createCatalogPreview({
          html: payload.html,
          resourceId: saved.id,
          sourceRevision: saved.contentRevision,
          upload: (preview) => previewMutation.mutateAsync(preview),
        });
        await utils.page.list.invalidate();
      } catch {
        // Preview generation is best-effort; the persisted page remains valid.
      }
      if (!pageId) router.push(`/pages/${saved.id}`);
    } catch (error) {
      const fallback = pageId ? t("pages.updateError") : t("pages.createError");
      setError(error instanceof Error ? error.message : fallback);
    }
  }

  const initialValues = data
    ? {
        name: data.name,
        path: data.path,
        type: data.type,
        status: data.status,
        captureData: data.captureData,
        redirectUrl: data.redirectUrl,
        redirectPageId: data.redirectPageId,
      }
    : {
        name: "",
        path: null as string | null,
        type: "LANDING" as const,
        status: "DRAFT" as const,
        captureData: false,
        redirectUrl: null as string | null,
        redirectPageId: null as string | null,
      };

  const notFound = Boolean(pageId && !isLoading && !data);

  const breadcrumbItems = [
    { label: t("pages.title"), url: "/pages" },
    {
      label: pageId ? t("pages.editPage") : t("pages.createTitle"),
    },
  ];

  return {
    data,
    isLoading,
    notFound,
    initialValues,
    editorHtmlRef,
    editorDesignRef,
    status,
    setError,
    setSuccess,
    reset,
    handleSubmit,
    regeneratePreview: data
      ? () =>
          createCatalogPreview({
            html: data.html,
            resourceId: data.id,
            sourceRevision: data.contentRevision,
            upload: (preview) => previewMutation.mutateAsync(preview),
          }).then(() => utils.page.list.invalidate())
      : null,
    isGeneratingPreview: previewMutation.isPending,
    breadcrumbItems,
    t,
    router,
    utils,
  };
}
