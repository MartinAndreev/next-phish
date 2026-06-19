"use client";

import { useRouter } from "next/navigation";
import { Formik } from "formik";
import { authClient } from "@/src/lib/auth-client";
import { resetPasswordSchema } from "@next-phish/shared";
import { toFormikValidation } from "@/src/lib/to-formik-validation";
import { ResetPasswordPresentation } from "./presentation";
import { useFormStatus } from "@/src/hooks/use-form-status";

interface ResetPasswordValues {
  newPassword: string;
  confirmPassword: string;
}

interface ResetPasswordContainerProps {
  token: string;
}

export function ResetPasswordContainer({ token }: ResetPasswordContainerProps) {
  const router = useRouter();
  const { status, setError } = useFormStatus();

  async function handleSubmit(values: ResetPasswordValues) {
    setError("");

    const { error: err } = await authClient.resetPassword({
      newPassword: values.newPassword,
      token,
    });

    if (err) {
      setError(err.message || err.code || "Failed to reset password");
      return;
    }

    router.push("/login?message=password-reset");
  }

  return (
    <Formik<ResetPasswordValues>
      initialValues={{ newPassword: "", confirmPassword: "" }}
      validate={toFormikValidation(resetPasswordSchema)}
      onSubmit={handleSubmit}
    >
      {({ isSubmitting }) => (
        <ResetPasswordPresentation
          error={status.type === "error" ? status.message : ""}
          isSubmitting={isSubmitting}
        />
      )}
    </Formik>
  );
}
