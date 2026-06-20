"use client";

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

export function OnboardingContainer() {
  const router = useRouter();
  const { status, setError } = useFormStatus();

  async function handleSubmit(values: OnboardingValues) {
    setError("");

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
      />
    </Formik>
  );
}
