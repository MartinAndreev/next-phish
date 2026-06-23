"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { trpc } from "@/src/lib/trpc";
import { useTranslation } from "@/src/lib/i18n";
import { useFormStatus } from "@/src/hooks/use-form-status";

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
    onSuccess: async (page) => {
      await utils.page.list.invalidate();
      router.push(`/pages/${page.id}`);
      setSuccess(t("pages.savePage"));
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
      setSuccess(t("pages.updatePage"));
    },
  });

  const importMutation = trpc.page.importFromUrl.useMutation();

  useEffect(() => {
    if (!data) {
      return;
    }

    editorHtmlRef.current = data.html;
    editorDesignRef.current = data.design;
  }, [data]);

  async function handleImportFromUrl(url: string): Promise<string> {
    const result = await importMutation.mutateAsync({ url });
    return result.html;
  }

  async function handleSubmit(values: {
    name: string;
    type: "LANDING" | "REDIRECT";
    status: "DRAFT" | "ACTIVE";
    captureData: boolean;
    redirectUrl: string | null;
    redirectPageId: string | null;
  }) {
    reset();

    const payload = {
      name: values.name.trim(),
      type: values.type,
      html: editorHtmlRef.current,
      design: editorDesignRef.current,
      status: values.status,
      captureData: values.captureData,
      redirectUrl: values.redirectUrl ?? null,
      redirectPageId: values.redirectPageId ?? null,
    };

    try {
      if (pageId) {
        await updateMutation.mutateAsync({ id: pageId, ...payload });
        return;
      }

      await createMutation.mutateAsync(payload);
    } catch (error) {
      const fallback = pageId ? t("pages.updateError") : t("pages.createError");
      setError(error instanceof Error ? error.message : fallback);
    }
  }

  const initialValues = data
    ? {
        name: data.name,
        type: data.type,
        status: data.status,
        captureData: data.captureData,
        redirectUrl: data.redirectUrl,
        redirectPageId: data.redirectPageId,
      }
    : {
        name: "",
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
    createMutation,
    updateMutation,
    importMutation,
    status,
    setError,
    setSuccess,
    reset,
    handleSubmit,
    handleImportFromUrl,
    breadcrumbItems,
    t,
    router,
    utils,
  };
}
