"use client";

import { Field, ErrorMessage, useFormikContext } from "formik";
import type { FieldInputProps } from "formik";
import { InputText } from "primereact/inputtext";

const errorCls = "mt-1 text-xs text-red-400";

interface FormFieldProps {
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
  className?: string;
  inputClassName?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function FormField({
  name,
  label,
  placeholder,
  type,
  autoComplete,
  className,
  inputClassName,
  onChange,
}: FormFieldProps) {
  const { errors, touched, submitCount } =
    useFormikContext<Record<string, unknown>>();
  const hasError = Boolean(errors[name] && (touched[name] || submitCount > 0));

  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-medium text-zinc-300"
      >
        {label}
      </label>
      <Field name={name}>
        {({ field }: { field: FieldInputProps<string> }) => (
          <InputText
            {...field}
            id={name}
            size="small"
            type={type}
            placeholder={placeholder}
            autoComplete={autoComplete}
            className={`w-full ${inputClassName ?? ""} ${className ?? ""}`}
            invalid={hasError}
            onChange={(e) => {
              field.onChange(e);
              onChange?.(e);
            }}
          />
        )}
      </Field>
      <ErrorMessage name={name} component="p" className={errorCls} />
    </div>
  );
}
