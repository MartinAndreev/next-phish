"use client";

import { useState } from "react";
import { Formik } from "formik";
import { authClient } from "@/src/lib/auth-client";
import { forgotPasswordSchema } from "@next-phish/shared";
import { toFormikValidation } from "@/src/lib/to-formik-validation";
import { ForgotPasswordPresentation } from "./presentation";

interface ForgotPasswordValues {
  email: string;
}

export function ForgotPasswordContainer() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(values: ForgotPasswordValues) {
    setError("");
    setSuccess("");

    const { error: err } = await authClient.requestPasswordReset({
      email: values.email,
      redirectTo: "/reset-password",
    });

    if (err) {
      setError(err.message || err.code || "Something went wrong");
      return;
    }

    setSuccess(
      "If an account exists with that email, a reset link has been sent.",
    );
  }

  return (
    <Formik<ForgotPasswordValues>
      initialValues={{ email: "" }}
      validate={toFormikValidation(forgotPasswordSchema)}
      onSubmit={handleSubmit}
    >
      {({ isSubmitting }) => (
        <ForgotPasswordPresentation
          error={error}
          success={success}
          isSubmitting={isSubmitting}
        />
      )}
    </Formik>
  );
}
