"use client";

import { useCallback, useRef } from "react";
import { Field, ErrorMessage, useFormikContext } from "formik";
import type { FieldInputProps } from "formik";
import { InputText } from "primereact/inputtext";
import { errorClassName } from "@/src/components/atoms/form-message.styles";
import { authClient } from "@/src/lib/auth-client";

const inputClassName =
  "w-full rounded-xl border border-white/10 bg-white/95 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] placeholder:text-slate-400";

interface SlugFieldProps {
  onStatusChange?: (
    status: "idle" | "checking" | "available" | "taken",
  ) => void;
}

export function SlugField({ onStatusChange }: SlugFieldProps) {
  const { errors, touched, submitCount } = useFormikContext<{ slug: string }>();
  const checkSlugTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const statusRef = useRef<"idle" | "checking" | "available" | "taken">("idle");

  const checkSlug = useCallback(
    (value: string) => {
      if (checkSlugTimeoutRef.current) {
        clearTimeout(checkSlugTimeoutRef.current);
      }

      if (!value) {
        statusRef.current = "idle";
        onStatusChange?.("idle");
        return;
      }

      statusRef.current = "checking";
      onStatusChange?.("checking");

      checkSlugTimeoutRef.current = setTimeout(async () => {
        const { data, error: err } = await authClient.organization.checkSlug({
          slug: value,
        });
        if (err) {
          statusRef.current = "taken";
          onStatusChange?.("taken");
        } else if (data?.status) {
          statusRef.current = "available";
          onStatusChange?.("available");
        } else {
          statusRef.current = "idle";
          onStatusChange?.("idle");
        }
      }, 300);
    },
    [onStatusChange],
  );

  return (
    <div className="space-y-2">
      <label htmlFor="slug" className="block text-sm font-medium text-zinc-100">
        Slug
      </label>
      <Field name="slug">
        {({ field }: { field: FieldInputProps<string> }) => (
          <div className="relative">
            <InputText
              size="small"
              id="slug"
              {...field}
              onChange={(e) => {
                field.onChange(e);
                checkSlug(e.target.value);
              }}
              invalid={Boolean(
                errors.slug && (touched.slug || submitCount > 0),
              )}
              className={inputClassName}
              placeholder="acme-security"
            />
            {statusRef.current === "checking" && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                Checking...
              </span>
            )}
            {statusRef.current === "available" && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-emerald-400">
                Available
              </span>
            )}
            {statusRef.current === "taken" && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-red-400">
                Taken
              </span>
            )}
          </div>
        )}
      </Field>
      <p className="text-xs text-zinc-400">
        Used in URLs. Auto-generated from the name, but you can edit it.
      </p>
      <ErrorMessage name="slug" component="p" className={errorClassName} />
    </div>
  );
}
