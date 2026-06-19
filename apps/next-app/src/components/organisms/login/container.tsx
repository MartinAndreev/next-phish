"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Formik } from "formik";
import { authClient } from "@/src/lib/auth-client";
import { loginSchema, magicLinkSchema } from "@next-phish/shared";
import { toFormikValidation } from "@/src/lib/to-formik-validation";
import { LoginPresentation } from "./presentation";

interface LoginValues {
  email: string;
  password: string;
}

interface LoginContainerProps {
  authError?: string | null;
  authSuccess?: string | null;
}

export function LoginContainer({
  authError,
  authSuccess,
}: LoginContainerProps) {
  const router = useRouter();
  const [useMagicLink, setUseMagicLink] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(values: LoginValues) {
    setError("");
    setSuccess("");

    try {
      if (useMagicLink) {
        const { error: err } = await authClient.signIn.magicLink({
          email: values.email,
          callbackURL: "/",
          errorCallbackURL: "/login",
        });
        if (err) {
          setError(err.message || err.code || "Something went wrong");
          return;
        }
        setSuccess("Magic link sent! Check your email.");
      } else {
        const { error: err } = await authClient.signIn.email({
          email: values.email,
          password: values.password,
        });
        if (err) {
          setError(err.message || err.code || "Invalid credentials");
          return;
        }
        router.push("/");
      }
    } catch {
      setError("An unexpected error occurred");
    }
  }

  const toggleMagicLink = () => {
    setUseMagicLink((prev) => !prev);
    setError("");
    setSuccess("");
  };

  return (
    <Formik<LoginValues>
      initialValues={{ email: "", password: "" }}
      validate={toFormikValidation(
        useMagicLink ? magicLinkSchema : loginSchema,
      )}
      onSubmit={handleSubmit}
    >
      {({ isSubmitting }) => (
        <LoginPresentation
          useMagicLink={useMagicLink}
          onToggleMagicLink={toggleMagicLink}
          error={error}
          success={success}
          authError={authError}
          authSuccess={authSuccess}
          isSubmitting={isSubmitting}
        />
      )}
    </Formik>
  );
}
