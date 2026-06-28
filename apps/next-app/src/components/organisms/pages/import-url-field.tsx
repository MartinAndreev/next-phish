"use client";

import { ErrorMessage, Field } from "formik";
import type { FieldInputProps } from "formik";
import { InputText } from "primereact/inputtext";
import { errorClassName } from "@/src/components/atoms/form-message.styles";

interface ImportUrlFieldProps {
  t: (key: string) => string;
}

export function ImportUrlField({ t }: ImportUrlFieldProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor="importUrl"
        className="block text-sm font-medium text-zinc-100"
      >
        {t("pages.urlLabel")}
      </label>
      <Field name="url">
        {({ field }: { field: FieldInputProps<string> }) => (
          <InputText
            id="importUrl"
            size="small"
            {...field}
            placeholder={t("pages.urlPlaceholder")}
            className="w-full rounded-xl border border-[#1C2945] bg-brand-dark text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] placeholder:text-slate-400"
          />
        )}
      </Field>
      <ErrorMessage name="url" component="p" className={errorClassName} />
    </div>
  );
}
