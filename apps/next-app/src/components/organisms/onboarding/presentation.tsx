"use client";

import { useRef, useEffect } from "react";
import { Form, Field, ErrorMessage, useFormikContext } from "formik";
import type { FieldInputProps } from "formik";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import {
  FormMessage,
  errorClassName,
} from "@/src/components/atoms/form-message";

const inputClassName =
  "w-full rounded-xl border border-white/10 bg-white/95 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] placeholder:text-slate-400";

interface OnboardingPresentationProps {
  error: string;
  slugStatus: "idle" | "checking" | "available" | "taken";
  onSlugChange: (slug: string) => void;
  slugify: (text: string) => string;
}

interface OnboardingValues {
  name: string;
  slug: string;
}

export function OnboardingPresentation({
  error,
  slugStatus,
  onSlugChange,
  slugify,
}: OnboardingPresentationProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const { errors, touched, submitCount, isSubmitting, values, setFieldValue } =
    useFormikContext<OnboardingValues>();

  const prevNameRef = useRef(values.name);
  useEffect(() => {
    const prevSlug = slugify(prevNameRef.current);
    if (values.name && (values.slug === prevSlug || values.slug === "")) {
      const newSlug = slugify(values.name);
      setFieldValue("slug", newSlug);
      onSlugChange(newSlug);
    }
    prevNameRef.current = values.name;
  }, [values.name, values.slug, setFieldValue, onSlugChange, slugify]);

  useEffect(() => {
    if (values.slug) {
      onSlugChange(values.slug);
    }
  }, [values.slug, onSlugChange]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h3 className="text-sm font-semibold text-cyan-200">
          What is an organization?
        </h3>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          An organization is a way to manage users and share access to your
          phishing simulation data. Members of an organization collaborate on
          campaigns, target groups, email templates, page templates, sending
          profiles, and logs — all under one roof.
        </p>
      </div>

      <Form ref={formRef} className="flex flex-col gap-5">
        <div className="space-y-2">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-zinc-100"
          >
            Organization name
          </label>
          <Field name="name">
            {({ field }: { field: FieldInputProps<string> }) => (
              <InputText
                id="name"
                {...field}
                invalid={Boolean(
                  errors.name && (touched.name || submitCount > 0),
                )}
                className={inputClassName}
                placeholder="Acme Security"
              />
            )}
          </Field>
          <ErrorMessage name="name" component="p" className={errorClassName} />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="slug"
            className="block text-sm font-medium text-zinc-100"
          >
            Slug
          </label>
          <Field name="slug">
            {({ field }: { field: FieldInputProps<string> }) => (
              <div className="relative">
                <InputText
                  id="slug"
                  {...field}
                  invalid={Boolean(
                    (errors.slug && (touched.slug || submitCount > 0)) ||
                    slugStatus === "taken",
                  )}
                  className={inputClassName}
                  placeholder="acme-security"
                />
                {slugStatus === "checking" && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                    Checking…
                  </span>
                )}
                {slugStatus === "available" && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-emerald-400">
                    ✓ Available
                  </span>
                )}
                {slugStatus === "taken" && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-red-400">
                    ✗ Taken
                  </span>
                )}
              </div>
            )}
          </Field>
          <p className="text-xs text-zinc-400">
            Used in URLs. Auto-generated from the name, but you can edit it.
          </p>
          <ErrorMessage name="slug" component="p" className={errorClassName} />
          {slugStatus === "taken" && (
            <p className={errorClassName}>
              This slug is already taken. Please choose another.
            </p>
          )}
        </div>

        {error && <FormMessage variant="error">{error}</FormMessage>}

        <Button
          type="submit"
          label="Create organization"
          loading={isSubmitting}
          disabled={isSubmitting || slugStatus === "taken"}
          className="mt-2 w-full justify-center rounded-xl border-0 bg-[var(--brand-gradient)] px-4 py-3.5 text-base font-semibold text-white shadow-[0_18px_35px_rgba(41,184,255,0.32)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_45px_rgba(41,184,255,0.42)]"
        />
      </Form>
    </div>
  );
}
