"use client";

import { useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { FieldInputProps } from "formik";
import { ErrorMessage, Field, Form, Formik } from "formik";
import { AutoComplete } from "primereact/autocomplete";
import { BreadCrumb } from "primereact/breadcrumb";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Skeleton } from "primereact/skeleton";
import { Tooltip } from "primereact/tooltip";
import { createPageSchema, PageListItemView } from "@next-phish/shared";
import { errorClassName } from "@/src/components/atoms/form-message.styles";
import { FormMessage } from "@/src/components/atoms/form-message";
import { toFormikValidation } from "@/src/lib/to-formik-validation";
import { selectSmall } from "@/src/components/ui/theme-constants";
import { trpc } from "@/src/lib/trpc";
import { ImportWebsiteDialog } from "./import-website-dialog";
import type { Editor } from "grapesjs";
import type { FormStatus } from "@/src/hooks/use-form-status";

const GrapesEditor = dynamic(
  () =>
    import("@/src/components/organisms/grapes-editor/grapes-editor").then(
      (module) => module.GrapesEditor,
    ),
  {
    ssr: false,
    loading: () => <Skeleton width="100%" height="720px" borderRadius="1rem" />,
  },
);

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
  onImportWebsite: (url: string) => Promise<string>;
  onSubmit: (values: PageFormValues) => Promise<void>;
  onCancel: () => void;
}

const breadcrumbHome = { icon: "pi pi-home", url: "/" };
const inputClassName =
  "w-full rounded-xl border border-white/10 bg-white/95 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] placeholder:text-slate-400 mb-2";

const statusOptions = [
  { label: "Draft", value: "DRAFT" },
  { label: "Active", value: "ACTIVE" },
] as const;

const typeOptions = [
  { label: "Landing", value: "LANDING" },
  { label: "Redirect", value: "REDIRECT" },
];

const redirectTargetOptions = [
  { label: "No redirect", value: "none" },
  { label: "Internal page", value: "page" },
  { label: "External URL", value: "url" },
];

export function PageForm({
  pageId,
  initialValues,
  status,
  breadcrumbItems,
  editorHtmlRef,
  editorDesignRef,
  initialDesign,
  t,
  onImportWebsite,
  onSubmit,
  onCancel,
}: PageFormProps) {
  const [importDialogVisible, setImportDialogVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pagesAutocompleteValue, setPagesAutocompleteValue] =
    useState<PageListItemView | null>(null);
  const editorRef = useRef<Editor | null>(null);

  const { data: searchResults } = trpc.page.list.useQuery(
    { search: searchQuery, limit: 10 },
    {
      enabled: searchQuery.length > 0,
      staleTime: 0,
      refetchOnWindowFocus: false,
    },
  );

  function handleSearch(event: { query: string }) {
    setSearchQuery(event.query);
  }

  const handleImport = useCallback(
    async (url: string) => {
      const html = await onImportWebsite(url);
      editorHtmlRef.current = html;
      editorRef.current?.setComponents(html);
    },
    [onImportWebsite, editorHtmlRef],
  );

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
                <section className="rounded-2xl border border-[#1C2945] bg-brand-dark p-5 shadow-[0_20px_45px_rgba(2,11,29,0.28)]">
                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-zinc-100"
                      >
                        {t("pages.name")}
                      </label>
                      <Field name="name">
                        {({ field }: { field: FieldInputProps<string> }) => (
                          <InputText
                            id="name"
                            size="small"
                            {...field}
                            className={inputClassName}
                          />
                        )}
                      </Field>
                      <ErrorMessage
                        name="name"
                        component="p"
                        className={`${errorClassName} mt-2`}
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">
                      {t("pages.editorLabel")}
                    </h2>
                    <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                      GrapesJS
                    </span>
                  </div>
                  <GrapesEditor
                    mode="page"
                    key={pageId ?? "new"}
                    initialDesign={initialDesign}
                    onEditor={(editor) => {
                      editorRef.current = editor;
                    }}
                    onChange={({ html, design }) => {
                      editorHtmlRef.current = html;
                      editorDesignRef.current = design;
                    }}
                  />
                </section>

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
                  <div className="flex flex-col gap-3 mb-3">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-zinc-100">
                        {t("pages.type")}
                      </label>
                      <Dropdown
                        pt={selectSmall}
                        value={values.type}
                        options={typeOptions}
                        onChange={(e) => setFieldValue("type", e.value)}
                        disabled={Boolean(pageId)}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-zinc-100">
                        {t("pages.status")}
                      </label>
                      <Dropdown
                        pt={selectSmall}
                        value={values.status}
                        options={statusOptions.map((option) => ({
                          label:
                            option.value === "ACTIVE"
                              ? t("common.active")
                              : t("common.draft"),
                          value: option.value,
                        }))}
                        onChange={(e) => setFieldValue("status", e.value)}
                        className="w-full"
                      />
                    </div>

                    {values.type === "LANDING" && (
                      <div className="flex items-center gap-2 md:col-span-2">
                        <Checkbox
                          inputId="captureData"
                          checked={values.captureData}
                          onChange={(e) =>
                            setFieldValue("captureData", e.checked ?? false)
                          }
                        />
                        <label
                          htmlFor="captureData"
                          className="text-sm font-medium text-zinc-100 cursor-pointer"
                        >
                          {t("pages.captureData")}
                        </label>
                        <i
                          className="capture-data-hint pi pi-info-circle cursor-help text-zinc-400"
                          data-pr-tooltip={t("pages.captureDataHint")}
                        />
                      </div>
                    )}

                    <div className="space-y-2 flex flex-col gap-3">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-zinc-100">
                          {t("pages.redirectTarget")}
                        </label>
                        <Dropdown
                          pt={selectSmall}
                          value={values.redirectTarget}
                          options={redirectTargetOptions}
                          onChange={async (e) => {
                            await Promise.all([
                              setFieldValue("redirectTarget", e.value),
                              setFieldValue("redirectPageId", null),
                              setFieldValue("redirectUrl", null),
                            ]);
                          }}
                          className="w-full"
                        />
                      </div>

                      {values.redirectTarget === "page" && (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-zinc-100">
                            {t("pages.redirectPage")}
                          </label>
                          <AutoComplete
                            value={pagesAutocompleteValue}
                            onChange={async (event) => {
                              setPagesAutocompleteValue(
                                event.value as unknown as PageListItemView,
                              );
                              await setFieldValue(
                                "redirectPageId",
                                (event?.value as unknown as PageListItemView)
                                  ?.id,
                              );
                            }}
                            suggestions={searchResults?.pages as never[]}
                            completeMethod={handleSearch}
                            field="name"
                            placeholder={t("pages.redirectPagePlaceholder")}
                            className="w-full"
                          />
                        </div>
                      )}

                      {values.redirectTarget === "url" && (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-zinc-100">
                            {t("pages.redirectUrl")}
                          </label>
                          <Field name="redirectUrl">
                            {({
                              field,
                            }: {
                              field: FieldInputProps<string>;
                            }) => (
                              <InputText
                                id="redirectUrl"
                                size="small"
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) => {
                                  setFieldValue(
                                    "redirectUrl",
                                    e.target.value || null,
                                  );
                                }}
                                placeholder={t("pages.urlPlaceholder")}
                                className={inputClassName}
                              />
                            )}
                          </Field>
                        </div>
                      )}
                    </div>
                  </div>

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
              onImport={handleImport}
              onHide={() => setImportDialogVisible(false)}
            />
          </Form>
        )}
      </Formik>
    </div>
  );
}
