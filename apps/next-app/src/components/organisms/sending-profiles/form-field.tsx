"use client";

import { Field, ErrorMessage } from "formik";
import type { ComponentType } from "react";
import { InputText } from "primereact/inputtext";

const errorCls = "mt-1 text-xs text-red-400";

interface FormFieldProps {
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
  as?: ComponentType<Record<string, unknown>>;
  className?: string;
}

export function FormField({
  name,
  label,
  placeholder,
  type,
  autoComplete,
  as: asComponent,
  className,
}: FormFieldProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-zinc-300">
        {label}
      </label>
      <Field
        as={asComponent ?? InputText}
        name={name}
        size="small"
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={className ?? "w-full"}
      />
      <ErrorMessage name={name} component="p" className={errorCls} />
    </div>
  );
}
