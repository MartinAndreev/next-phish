"use client";

import { Form, useFormikContext } from "formik";
import { Button } from "primereact/button";
import type { UpdateOrganizationInput } from "@next-phish/shared";
import type { FormStatus } from "@/src/hooks/use-form-status";
import { FormMessage } from "@/src/components/atoms/form-message";
import { FormField } from "@/src/components/molecules/form-field";
import { useTranslation } from "@/src/lib/i18n";

interface GeneralFormPresentationProps {
  status: FormStatus;
}

export function GeneralFormPresentation({
  status,
}: GeneralFormPresentationProps) {
  const t = useTranslation();
  const { isSubmitting } = useFormikContext<UpdateOrganizationInput>();

  return (
    <Form className="flex max-w-xl flex-col gap-5">
      <FormField
        name="name"
        label={t("organizations.organizationName")}
        placeholder={t("organizations.organizationName")}
        inputClassName="rounded-xl border-white/10 bg-white/95 text-slate-900"
      />
      <div>
        <FormField
          name="slug"
          label={t("organizations.slug")}
          placeholder="acme-corporation"
          inputClassName="rounded-xl border-white/10 bg-white/95 text-slate-900"
        />
        <p className="mt-2 text-xs text-zinc-400">
          {t("organizations.slugHint")}
        </p>
      </div>

      {status.type === "error" && (
        <FormMessage variant="error">{status.message}</FormMessage>
      )}
      {status.type === "success" && (
        <FormMessage variant="success">{status.message}</FormMessage>
      )}

      <Button
        size="small"
        type="submit"
        label={t("common.saveChanges")}
        loading={isSubmitting}
        disabled={isSubmitting}
        className="w-fit rounded-xl border-0 bg-(image:--brand-gradient) px-6 py-3 text-sm font-semibold text-white"
      />
    </Form>
  );
}
