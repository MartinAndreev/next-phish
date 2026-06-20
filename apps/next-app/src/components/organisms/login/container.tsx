"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Formik } from "formik";
import { authClient } from "@/src/lib/auth-client";
import { loginSchema, magicLinkSchema } from "@next-phish/shared";
import { toFormikValidation } from "@/src/lib/to-formik-validation";
import { LoginPresentation } from "./presentation";
import { useFormStatus } from "@/src/hooks/use-form-status";
import { useTranslation } from "@/src/lib/i18n";

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
  const t = useTranslation();
  const router = useRouter();
  const [useMagicLink, setUseMagicLink] = useState(false);
  const { status, setError, setSuccess, reset } = useFormStatus();

  async function handleSubmit(values: LoginValues) {
    reset();

    try {
      if (useMagicLink) {
        const { error: err } = await authClient.signIn.magicLink({
          email: values.email,
          callbackURL: "/",
          errorCallbackURL: "/login",
        });
        if (err) {
          setError(err.message || err.code || t("login.somethingWentWrong"));
          return;
        }
        setSuccess(t("login.magicLinkSent"));
      } else {
        const { error: err } = await authClient.signIn.email({
          email: values.email,
          password: values.password,
        });
        if (err) {
          setError(err.message || err.code || t("login.invalidCredentials"));
          return;
        }
        router.push("/");
      }
    } catch {
      setError(t("login.unexpectedError"));
    }
  }

  const toggleMagicLink = () => {
    setUseMagicLink((prev) => !prev);
    reset();
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
          error={status.type === "error" ? status.message : ""}
          success={status.type === "success" ? status.message : ""}
          authError={authError}
          authSuccess={authSuccess}
          isSubmitting={isSubmitting}
        />
      )}
    </Formik>
  );
}
