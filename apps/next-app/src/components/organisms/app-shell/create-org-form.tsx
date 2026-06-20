"use client";

import { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import type { FieldInputProps } from "formik";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { FormMessage } from "@/src/components/atoms/form-message";
import { errorClassName } from "@/src/components/atoms/form-message.styles";
import { createOrganizationSchema } from "@next-phish/shared";
import { toFormikValidation } from "@/src/lib/to-formik-validation";
import { SlugField } from "@/src/components/atoms/slug-field";
import { slugify } from "@/src/lib/slugify";
import { useTranslation } from "@/src/lib/i18n";

const inputClassName =
  "w-full rounded-xl border border-white/10 bg-white/95 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] placeholder:text-slate-400 mb-2";

interface CreateOrgFormValues {
  name: string;
  slug: string;
}

interface CreateOrgFormProps {
  error: string;
  isSubmitting: boolean;
  onSubmit: (values: CreateOrgFormValues) => Promise<void>;
  onCancel: () => void;
}

export function CreateOrgForm({
  error,
  isSubmitting,
  onSubmit,
  onCancel,
}: CreateOrgFormProps) {
  const t = useTranslation();
  const [slugStatus, setSlugStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");

  return (
    <Formik<CreateOrgFormValues>
      initialValues={{ name: "", slug: "" }}
      validate={toFormikValidation(createOrganizationSchema)}
      onSubmit={onSubmit}
    >
      {({ setFieldValue, values }) => (
        <Form className="flex flex-col gap-4 mt-5">
          <div className="space-y-2">
            <label
              htmlFor="org-name"
              className="block text-sm font-medium text-zinc-100"
            >
              {t("organizations.organizationName")}
            </label>
            <Field name="name">
              {({ field }: { field: FieldInputProps<string> }) => (
                <InputText
                  size="small"
                  id="org-name"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    const newSlug = slugify(e.target.value);
                    if (!values.slug || values.slug === slugify(values.name)) {
                      setFieldValue("slug", newSlug);
                    }
                  }}
                  className={inputClassName}
                  placeholder="Acme Security"
                />
              )}
            </Field>
            <ErrorMessage
              name="name"
              component="p"
              className={`${errorClassName} mt-2`}
            />
          </div>

          <SlugField onStatusChange={setSlugStatus} />

          {error && <FormMessage variant="error">{error}</FormMessage>}

          <div className="flex justify-end gap-2">
            <Button
              size="small"
              type="button"
              label={t("common.cancel")}
              outlined
              onClick={onCancel}
              className="rounded-xl border-white/10 px-4 py-2 text-sm text-zinc-300"
            />
            <Button
              size="small"
              type="submit"
              label={t("common.create")}
              loading={isSubmitting}
              disabled={isSubmitting || slugStatus === "taken"}
              className="rounded-xl border-0 bg-(image:--brand-gradient) px-4 py-2 text-sm font-semibold text-white"
            />
          </div>
        </Form>
      )}
    </Formik>
  );
}
