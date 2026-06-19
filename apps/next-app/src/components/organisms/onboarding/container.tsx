"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Formik } from "formik";
import { authClient } from "@/src/lib/auth-client";
import { createOrganizationSchema } from "@next-phish/shared";
import { toFormikValidation } from "@/src/lib/to-formik-validation";
import { OnboardingPresentation } from "./presentation";
import { useFormStatus } from "@/src/hooks/use-form-status";

interface OnboardingValues {
  name: string;
  slug: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function OnboardingContainer() {
  const router = useRouter();
  const { status, setError } = useFormStatus();
  const [slugStatus, setSlugStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");

  const checkSlugTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const checkSlug = useCallback((slug: string) => {
    if (checkSlugTimeoutRef.current) {
      clearTimeout(checkSlugTimeoutRef.current);
    }

    if (!slug) {
      setSlugStatus("idle");
      return;
    }

    setSlugStatus("checking");

    checkSlugTimeoutRef.current = setTimeout(async () => {
      const { data, error: err } = await authClient.organization.checkSlug({
        slug,
      });
      if (err) {
        setSlugStatus("taken");
      } else if (data?.status) {
        setSlugStatus("available");
      } else {
        setSlugStatus("idle");
      }
    }, 300);
  }, []);

  async function handleSubmit(values: OnboardingValues) {
    setError("");

    if (slugStatus === "taken") {
      setError("This slug is already taken");
      return;
    }

    const { error: err } = await authClient.organization.create({
      name: values.name,
      slug: values.slug,
    });

    if (err) {
      setError(err.message || err.code || "Failed to create organization");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <Formik<OnboardingValues>
      initialValues={{ name: "", slug: "" }}
      validate={toFormikValidation(createOrganizationSchema)}
      onSubmit={handleSubmit}
    >
      <OnboardingPresentation
        error={status.type === "error" ? status.message : ""}
        slugStatus={slugStatus}
        onSlugChange={checkSlug}
        slugify={slugify}
      />
    </Formik>
  );
}
