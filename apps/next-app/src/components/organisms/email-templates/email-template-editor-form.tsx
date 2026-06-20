"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import type { FieldInputProps } from "formik";
import { BreadCrumb } from "primereact/breadcrumb";
import { Button } from "primereact/button";
import { Chips } from "primereact/chips";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Skeleton } from "primereact/skeleton";
import { createEmailTemplateSchema } from "@next-phish/shared";
import { errorClassName } from "@/src/components/atoms/form-message.styles";
import { FormMessage } from "@/src/components/atoms/form-message";
import { useFormStatus } from "@/src/hooks/use-form-status";
import { toFormikValidation } from "@/src/lib/to-formik-validation";
import { trpc } from "@/src/lib/trpc";
import { useTranslation } from "@/src/lib/i18n";
import { selectSmall } from "@/src/components/ui/theme-constants";
import { TemplateVariablePanel } from "./template-variable-panel";

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

interface EmailTemplateEditorFormProps {
  templateId?: string;
}

interface EmailTemplateFormValues {
  name: string;
  tags: string[];
  status: "DRAFT" | "ACTIVE";
}

const breadcrumbHome = { icon: "pi pi-home", url: "/" };
const inputClassName =
  "w-full rounded-xl border border-white/10 bg-white/95 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] placeholder:text-slate-400 mb-2";

const statusOptions = [
  { label: "Draft", value: "DRAFT" },
  { label: "Active", value: "ACTIVE" },
] as const;

export function EmailTemplateEditorForm({
  templateId,
}: EmailTemplateEditorFormProps) {
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

  useEffect(() => {
    if (!data) {
      return;
    }

    editorHtmlRef.current = data.html;
    editorDesignRef.current = data.design;
  }, [data]);

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

  if (templateId && !data) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-8">
        <p className="text-zinc-400">{t("emailTemplates.notFound")}</p>
      </div>
    );
  }

  const initialValues: EmailTemplateFormValues = data
    ? {
        name: data.name,
        tags: data.tags,
        status: data.status,
      }
    : {
        name: "",
        tags: [],
        status: "DRAFT",
      };

  const breadcrumbItems = [
    { label: t("emailTemplates.title"), url: "/email-templates" },
    {
      label: templateId
        ? t("emailTemplates.editTemplate")
        : t("emailTemplates.createTitle"),
    },
  ];

  return (
    <div className="px-6 py-8">
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
          }),
        )}
        onSubmit={async (values) => {
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
        }}
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

                    <div className="space-y-2">
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
                    initialDesign={data?.design}
                    onChange={({ html, design }) => {
                      editorHtmlRef.current = html;
                      editorDesignRef.current = design;
                    }}
                  />
                </section>
              </div>

              <div className="space-y-6">
                <TemplateVariablePanel />

                <section className="rounded-2xl border border-[#1C2945] bg-brand-dark p-5 shadow-[0_20px_45px_rgba(2,11,29,0.28)]">
                  <div className="flex flex-col gap-3">
                    <Button
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
                      type="button"
                      outlined
                      label={t("common.cancel")}
                      onClick={() => router.push("/email-templates")}
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
          </Form>
        )}
      </Formik>
    </div>
  );
}
