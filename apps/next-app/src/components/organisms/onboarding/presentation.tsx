"use client";

import { useRef, useEffect, useState } from "react";
import { Form, useFormikContext } from "formik";
import { Button } from "primereact/button";
import { FormField } from "@/src/components/molecules/form-field";
import { FormMessage } from "@/src/components/atoms/form-message";
import { SlugField } from "@/src/components/atoms/slug-field";
import { slugify } from "@/src/lib/slugify";
import { useTranslation } from "@/src/lib/i18n";

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
  const t = useTranslation();
  const formRef = useRef<HTMLFormElement>(null);
  const { isSubmitting, values, setFieldValue } =
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
          {t("onboarding.infoTitle")}
        </h3>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          {t("onboarding.infoBody")}
        </p>
      </div>

      <Form ref={formRef} className="flex flex-col gap-5">
        <div className="space-y-2">
          <FormField
            name="name"
            label={t("onboarding.organizationName")}
            placeholder="Acme Security"
            inputClassName={inputClassName}
          />
        </div>

        <SlugField onStatusChange={setSlugStatus} />

        {error && <FormMessage variant="error">{error}</FormMessage>}

        <Button
          size="small"
          type="submit"
          label={t("onboarding.createOrganization")}
          loading={isSubmitting}
          disabled={isSubmitting || slugStatus === "taken"}
          className="mt-2 w-full justify-center rounded-xl border-0 bg-(image:--brand-gradient) px-4 py-3.5 text-base font-semibold text-white shadow-[0_18px_35px_rgba(41,184,255,0.32)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_45px_rgba(41,184,255,0.42)]"
        />
      </Form>
    </div>
  );
}
