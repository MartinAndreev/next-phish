"use client";

import { useRef, useEffect, useState } from "react";
import { Form, Field, ErrorMessage, useFormikContext } from "formik";
import type { FieldInputProps } from "formik";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import {
  FormMessage,
  errorClassName,
} from "@/src/components/atoms/form-message";
import { SlugField } from "@/src/components/atoms/slug-field";
import { slugify } from "@/src/lib/slugify";

const inputClassName =
  "w-full rounded-xl border border-white/10 bg-white/95 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] placeholder:text-slate-400";

interface OnboardingPresentationProps {
  error: string;
}

interface OnboardingValues {
  name: string;
  slug: string;
}

export function OnboardingPresentation({ error }: OnboardingPresentationProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const { errors, touched, submitCount, isSubmitting, values, setFieldValue } =
    useFormikContext<OnboardingValues>();
  const [slugStatus, setSlugStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");

  const prevNameRef = useRef(values.name);
  useEffect(() => {
    const prevSlug = slugify(prevNameRef.current);
    if (values.name && (values.slug === prevSlug || values.slug === "")) {
      const newSlug = slugify(values.name);
      setFieldValue("slug", newSlug);
    }
    prevNameRef.current = values.name;
  }, [values.name, values.slug, setFieldValue]);

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
                size="small"
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

        <SlugField onStatusChange={setSlugStatus} />

        {error && <FormMessage variant="error">{error}</FormMessage>}

        <Button
          size="small"
          type="submit"
          label="Create organization"
          loading={isSubmitting}
          disabled={isSubmitting || slugStatus === "taken"}
          className="mt-2 w-full justify-center rounded-xl border-0 bg-(image:--brand-gradient) px-4 py-3.5 text-base font-semibold text-white shadow-[0_18px_35px_rgba(41,184,255,0.32)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_45px_rgba(41,184,255,0.42)]"
        />
      </Form>
    </div>
  );
}
