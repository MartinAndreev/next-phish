"use client";

import dynamic from "next/dynamic";
import { Formik, Form, Field, ErrorMessage } from "formik";
import type { FieldInputProps } from "formik";
import { BreadCrumb } from "primereact/breadcrumb";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { Chips } from "primereact/chips";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Skeleton } from "primereact/skeleton";
import { Tooltip } from "primereact/tooltip";
import { createEmailTemplateSchema } from "@next-phish/shared";
import { errorClassName } from "@/src/components/atoms/form-message.styles";
import { FormMessage } from "@/src/components/atoms/form-message";
import { toFormikValidation } from "@/src/lib/to-formik-validation";
import { selectSmall } from "@/src/components/ui/theme-constants";
import { FileAttachmentPanel } from "./file-attachment-panel";
import { TemplateVariablePanel } from "./template-variable-panel";
import type { AttachedFile } from "./file-attachment-panel";
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

interface EmailTemplateFormValues {
  name: string;
  tags: string[];
  status: "DRAFT" | "ACTIVE";
  trackingPixel: boolean;
}

interface EmailTemplateFormProps {
  templateId?: string;
  initialValues: EmailTemplateFormValues;
  attachedFiles: AttachedFile[];
  uploading: boolean;
  status: FormStatus;
  breadcrumbItems: Array<{ label: string; url?: string }>;
  editorHtmlRef: React.MutableRefObject<string>;
  editorDesignRef: React.MutableRefObject<unknown>;
  initialDesign?: unknown;
  initialHtml?: string;
  t: (key: string) => string;
  onUpload: (file: File) => Promise<void>;
  onRemove: (fileId: string) => Promise<void>;
  onSubmit: (values: EmailTemplateFormValues) => Promise<void>;
  onCancel: () => void;
}

const breadcrumbHome = { icon: "pi pi-home", url: "/" };
const inputClassName =
  "w-full rounded-xl border border-white/10 bg-white/95 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] placeholder:text-slate-400 mb-2";

const statusOptions = [
  { label: "Draft", value: "DRAFT" },
  { label: "Active", value: "ACTIVE" },
] as const;

export function EmailTemplateForm({
  templateId,
  initialValues,
  attachedFiles,
  uploading,
  status,
  breadcrumbItems,
  editorHtmlRef,
  editorDesignRef,
  initialDesign,
  initialHtml,
  t,
  onUpload,
  onRemove,
  onSubmit,
  onCancel,
}: EmailTemplateFormProps) {
  return (
    <div className="px-6 py-8">
      <Tooltip target=".tracking-pixel-hint" position="top" />

      <div className="mb-6">
        <BreadCrumb home={breadcrumbHome} model={breadcrumbItems} />
        <h1 className="mt-2 text-2xl font-semibold text-white">
          {templateId
            ? t("emailTemplates.editTemplate")
            : t("emailTemplates.createTitle")}
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          {templateId
            ? t("emailTemplates.editSubtitle")
            : t("emailTemplates.createSubtitle")}
        </p>
      </div>

      <Formik<EmailTemplateFormValues>
        initialValues={initialValues}
        enableReinitialize
        validate={toFormikValidation(
          createEmailTemplateSchema.pick({
            name: true,
            tags: true,
            status: true,
            trackingPixel: true,
          }),
        )}
        onSubmit={onSubmit}
      >
        {({ isSubmitting, values, setFieldValue }) => (
          <Form className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-6">
                <section className="rounded-2xl border border-[#1C2945] bg-brand-dark p-5 shadow-[0_20px_45px_rgba(2,11,29,0.28)]">
                  <div className="grid gap-5 md:grid-cols-3">
                    <div className="space-y-2 md:col-span-3">
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-zinc-100"
                      >
                        {t("emailTemplates.name")}
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

                    <div className="space-y-2 md:col-span-2">
                      <label className="block text-sm font-medium text-zinc-100">
                        {t("emailTemplates.tags")}
                      </label>
                      <Chips
                        value={values.tags}
                        size={"small" as never}
                        separator=","
                        onChange={(e) => setFieldValue("tags", e.value ?? [])}
                        placeholder={t("emailTemplates.tagsPlaceholder")}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-zinc-100">
                        {t("emailTemplates.status")}
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

                    <div className="flex items-center gap-2 md:col-span-3">
                      <Checkbox
                        inputId="trackingPixel"
                        checked={values.trackingPixel}
                        onChange={(e) =>
                          setFieldValue("trackingPixel", e.checked ?? false)
                        }
                        className="h-4 w-4"
                        pt={{
                          input: { className: "h-4 w-4" },
                          box: {
                            className:
                              "h-4 w-4 rounded border border-white/10 bg-white/5",
                          },
                          icon: { className: "text-cyan-400 text-xs" },
                        }}
                      />
                      <label
                        htmlFor="trackingPixel"
                        className="text-sm font-medium text-zinc-100"
                      >
                        {t("emailTemplates.trackingPixel")}
                      </label>
                      <i
                        className="tracking-pixel-hint pi pi-info-circle cursor-help text-zinc-400"
                        data-pr-tooltip={t("emailTemplates.trackingPixelHint")}
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">
                      {t("emailTemplates.editorLabel")}
                    </h2>
                    <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                      GrapesJS
                    </span>
                  </div>
                  <GrapesEditor
                    mode="email"
                    key={templateId ?? "new"}
                    initialDesign={initialDesign as object}
                    initialHtml={initialHtml}
                    onChange={({ html, design }) => {
                      editorHtmlRef.current = html;
                      editorDesignRef.current = design;
                    }}
                  />
                </section>

                <FileAttachmentPanel
                  files={attachedFiles}
                  onUpload={onUpload}
                  onRemove={onRemove}
                  disabled={uploading}
                />
              </div>

              <div className="space-y-6">
                <TemplateVariablePanel />

                <section className="rounded-2xl border border-[#1C2945] bg-brand-dark p-5 shadow-[0_20px_45px_rgba(2,11,29,0.28)]">
                  <div className="flex flex-col gap-3">
                    <Button
                      size="small"
                      type="submit"
                      loading={isSubmitting}
                      disabled={isSubmitting}
                      label={
                        templateId
                          ? t("emailTemplates.updateTemplate")
                          : values.status === "ACTIVE"
                            ? t("emailTemplates.saveTemplate")
                            : t("emailTemplates.saveDraft")
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

                  {["error", "success"].includes(status.type) && (
                    <div className="mt-3">
                      {status.type === "error" && (
                        <FormMessage variant="error">
                          {status.message}
                        </FormMessage>
                      )}
                      {status.type === "success" && (
                        <FormMessage variant="success">
                          {status.message}
                        </FormMessage>
                      )}
                    </div>
                  )}
                </section>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}
