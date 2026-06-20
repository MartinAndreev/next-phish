"use client";

import { useRouter } from "next/navigation";
import { Formik } from "formik";
import { authClient } from "@/src/lib/auth-client";
import { setupSchema } from "@next-phish/shared";
import { toFormikValidation } from "@/src/lib/to-formik-validation";
import { SetupPresentation } from "./presentation";
import { useFormStatus } from "@/src/hooks/use-form-status";
import { useTranslation } from "@/src/lib/i18n";

interface SetupValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export function SetupContainer() {
  const t = useTranslation();
  const router = useRouter();
  const { status, setError } = useFormStatus();

  async function handleSubmit(values: SetupValues) {
    setError("");

    const { error: err } = await authClient.signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
    });

    if (err) {
      setError(err.message || err.code || t("setup.failedToCreateAccount"));
      return;
    }

    router.push("/login?message=check-email");
  }

  return (
    <Formik<SetupValues>
      initialValues={{ name: "", email: "", password: "", confirmPassword: "" }}
      validate={toFormikValidation(setupSchema)}
      onSubmit={handleSubmit}
    >
      <SetupPresentation
        error={status.type === "error" ? status.message : ""}
      />
    </Formik>
  );
}
