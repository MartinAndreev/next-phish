"use client";

import { useCallback, useRef, useState } from "react";
import { Form, Formik } from "formik";
import { BreadCrumb } from "primereact/breadcrumb";
import { Button } from "primereact/button";
import { Tooltip } from "primereact/tooltip";
import { createPageSchema } from "@next-phish/shared";
import { FormMessage } from "@/src/components/atoms/form-message";
import { toFormikValidation } from "@/src/lib/to-formik-validation";
import { ImportWebsiteDialog } from "./import-website-dialog";
import { PageNameField } from "./page-name-field";
import { PageEditorSection } from "./page-editor-section";
import { PageSettingsFields } from "./page-settings-fields";
import type { Editor } from "grapesjs";
import type { FormStatus } from "@/src/hooks/use-form-status";

interface PageFormValues {
  name: string;
  type: "LANDING" | "REDIRECT";
  status: "DRAFT" | "ACTIVE";
  captureData: boolean;
  redirectTarget: "none" | "page" | "url";
  redirectPageId: string | null;
  redirectUrl: string | null;
}

interface PageFormProps {
  pageId?: string;
  initialValues: PageFormValues;
  status: FormStatus;
  breadcrumbItems: Array<{ label: string; url?: string }>;
  editorHtmlRef: React.MutableRefObject<string>;
  editorDesignRef: React.MutableRefObject<unknown>;
  initialDesign?: unknown;
  t: (key: string) => string;
  onSubmit: (values: PageFormValues) => Promise<void>;
  onCancel: () => void;
}

const breadcrumbHome = { icon: "pi pi-home", url: "/" };

export function PageForm({
  pageId,
  initialValues,
  status,
  breadcrumbItems,
  editorHtmlRef,
  editorDesignRef,
  initialDesign,
  t,
  onSubmit,
  onCancel,
}: PageFormProps) {
  const [importDialogVisible, setImportDialogVisible] = useState(false);
  const editorRef = useRef<Editor | null>(null);

  const handleImportComplete = useCallback(
    (html: string) => {
      editorHtmlRef.current = html;
      editorRef.current?.setComponents(html);
    },
    [editorHtmlRef],
  );

  const handleEditorRef = useCallback((editor: Editor) => {
    editorRef.current = editor;
  }, []);

  return (
    <div className="px-6 py-8">
      <Tooltip target=".capture-data-hint" position="top" />

      <div className="mb-6">
        <BreadCrumb home={breadcrumbHome} model={breadcrumbItems} />
        <h1 className="mt-2 text-2xl font-semibold text-white">
          {pageId ? t("pages.editPage") : t("pages.createTitle")}
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          {pageId ? t("pages.editSubtitle") : t("pages.createSubtitle")}
        </p>
      </div>

      <Formik<PageFormValues>
        initialValues={initialValues}
        enableReinitialize
        validate={toFormikValidation(
          createPageSchema.pick({
            name: true,
            type: true,
            status: true,
            captureData: true,
          }),
        )}
        onSubmit={onSubmit}
      >
        {({ isSubmitting, values, setFieldValue }) => (
          <Form className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-6">
                <PageNameField t={t} />

                <PageEditorSection
                  pageId={pageId}
                  initialDesign={initialDesign}
                  editorHtmlRef={editorHtmlRef}
                  editorDesignRef={editorDesignRef}
                  onEditorRef={handleEditorRef}
                  t={t}
                />

                {values.type === "LANDING" && (
                  <div>
                    <Button
                      size="small"
                      type="button"
                      outlined
                      icon="pi pi-download"
                      label={t("pages.importWebsite")}
                      onClick={() => setImportDialogVisible(true)}
                      className="rounded-xl border-white/10 px-5 py-3 text-sm font-medium text-white"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <section className="rounded-2xl border border-[#1C2945] bg-brand-dark p-5 shadow-[0_20px_45px_rgba(2,11,29,0.28)] sticky top-3">
                  <PageSettingsFields
                    pageId={pageId}
                    values={values}
                    setFieldValue={setFieldValue}
                    t={t}
                  />

                  <div className="flex flex-col gap-3">
                    <Button
                      size="small"
                      type="submit"
                      loading={isSubmitting}
                      disabled={isSubmitting}
                      label={
                        pageId
                          ? t("pages.updatePage")
                          : values.status === "ACTIVE"
                            ? t("pages.savePage")
                            : t("pages.saveDraft")
                      }
                      className="rounded-xl border-0 bg-(image:--brand-gradient) px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(41,184,255,0.25)]"
                    />
                    <Button
                      size="small"
                      type="button"
                      outlined
                      label={t("common.cancel")}
                      onClick={onCancel}
                      className="rounded-xl border-white/10 px-5 py-3 text-sm font-medium text-white"
                    />
                  </div>

                  {status.type === "error" && (
                    <FormMessage variant="error">{status.message}</FormMessage>
                  )}
                  {status.type === "success" && (
                    <FormMessage variant="success">
                      {status.message}
                    </FormMessage>
                  )}
                </section>
              </div>
            </div>

            <ImportWebsiteDialog
              visible={importDialogVisible}
              t={t}
              onImportComplete={handleImportComplete}
              onHide={() => setImportDialogVisible(false)}
            />
          </Form>
        )}
      </Formik>
    </div>
  );
}
