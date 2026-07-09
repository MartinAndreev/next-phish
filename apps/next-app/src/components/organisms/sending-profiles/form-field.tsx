"use client";

import { Field, ErrorMessage, useFormikContext } from "formik";
import { InputText } from "primereact/inputtext";

const errorCls = "mt-1 text-xs text-red-400";

interface FormFieldProps {
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
  className?: string;
}

export function FormField({
  name,
  label,
  placeholder,
  type,
  autoComplete,
  className,
}: FormFieldProps) {
  const { errors, touched, submitCount } =
    useFormikContext<Record<string, unknown>>();
  const hasError = Boolean(errors[name] && (touched[name] || submitCount > 0));

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-zinc-300">
        {label}
      </label>
      <Field
        as={InputText}
        name={name}
        size="small"
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={[className ?? "w-full", hasError ? "border-red-500/50" : ""]
          .join(" ")
          .trim()}
      />
      <ErrorMessage name={name} component="p" className={errorCls} />
    </div>
  );
}
