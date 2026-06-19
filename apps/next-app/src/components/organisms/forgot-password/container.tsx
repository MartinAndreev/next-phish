"use client";

import { useRouter } from "next/navigation";
import { Formik } from "formik";
import { authClient } from "@/src/lib/auth-client";
import { forgotPasswordSchema } from "@next-phish/shared";
import { toFormikValidation } from "@/src/lib/to-formik-validation";
import { ForgotPasswordPresentation } from "./presentation";
import { useFormStatus } from "@/src/hooks/use-form-status";

interface ForgotPasswordValues {
  email: string;
}

export function ForgotPasswordContainer() {
  const router = useRouter();
  const { status, setError, reset } = useFormStatus();

  async function handleSubmit(values: ForgotPasswordValues) {
    reset();

    const { error: err } = await authClient.emailOtp.requestPasswordReset({
      email: values.email,
    });

    if (err) {
      setError(err.message || err.code || "Something went wrong");
      return;
    }

    router.push(`/reset-password?email=${encodeURIComponent(values.email)}`);
  }

  return (
    <Formik<ForgotPasswordValues>
      initialValues={{ email: "" }}
      validate={toFormikValidation(forgotPasswordSchema)}
      onSubmit={handleSubmit}
    >
      {({ isSubmitting }) => (
        <ForgotPasswordPresentation
          error={status.type === "error" ? status.message : ""}
          success={status.type === "success" ? status.message : ""}
          isSubmitting={isSubmitting}
        />
      )}
    </Formik>
  );
}
