"use client";

import { FormSkeleton } from "@/src/components/atoms/form-skeleton";
import { usePageEditor } from "@/src/hooks/use-page-editor";
import { PageForm } from "./page-form";

interface PageFormContainerProps {
  pageId?: string;
}

export function PageFormContainer({ pageId }: PageFormContainerProps) {
  const {
    data,
    isLoading,
    notFound,
    initialValues,
    editorHtmlRef,
    editorDesignRef,
    status,
    handleSubmit,
    regeneratePreview,
    isGeneratingPreview,
    breadcrumbItems,
    t,
    router,
  } = usePageEditor({ pageId });

  const formInitialValues = {
    name: initialValues.name,
    path: initialValues.path,
    type: initialValues.type,
    status: initialValues.status,
    captureData: initialValues.captureData,
    redirectTarget: (() => {
      if (initialValues.redirectPageId) return "page" as const;
      if (initialValues.redirectUrl) return "url" as const;
      return "none" as const;
    })(),
    redirectPageId: initialValues.redirectPageId,
    redirectUrl: initialValues.redirectUrl,
  };

  if (pageId && isLoading) {
    return <FormSkeleton />;
  }

  if (notFound) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-8">
        <p className="text-zinc-400">{t("pages.notFound")}</p>
      </div>
    );
  }

  async function handleFormSubmit(values: {
    name: string;
    path: string | null;
    type: "LANDING" | "REDIRECT";
    status: "DRAFT" | "ACTIVE";
    captureData: boolean;
    redirectTarget: "none" | "page" | "url";
    redirectPageId: string | null;
    redirectUrl: string | null;
  }) {
    await handleSubmit({
      name: values.name,
      path: values.path,
      type: values.type,
      status: values.status,
      captureData: values.captureData,
      redirectUrl: values.redirectTarget === "url" ? values.redirectUrl : null,
      redirectPageId:
        values.redirectTarget === "page" ? values.redirectPageId : null,
    });
  }

  return (
    <PageForm
      pageId={pageId}
      initialValues={formInitialValues}
      status={status}
      breadcrumbItems={breadcrumbItems}
      editorHtmlRef={editorHtmlRef}
      editorDesignRef={editorDesignRef}
      initialDesign={data?.design as object | undefined}
      initialHtml={data?.html}
      t={t}
      onSubmit={handleFormSubmit}
      onCancel={() => router.push("/pages")}
      onRegeneratePreview={regeneratePreview ?? undefined}
      isGeneratingPreview={isGeneratingPreview}
    />
  );
}
