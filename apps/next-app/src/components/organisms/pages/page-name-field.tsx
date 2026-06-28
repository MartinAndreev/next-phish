"use client";

import type { FieldInputProps } from "formik";
import { ErrorMessage, Field } from "formik";
import { InputText } from "primereact/inputtext";
import { errorClassName } from "@/src/components/atoms/form-message.styles";

interface PageNameFieldProps {
  t: (key: string) => string;
}

const inputClassName =
  "w-full rounded-xl border border-white/10 bg-white/95 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] placeholder:text-slate-400 mb-2";

export function PageNameField({ t }: PageNameFieldProps) {
  return (
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
  );
}
