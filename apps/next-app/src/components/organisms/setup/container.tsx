"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Formik } from "formik";
import { authClient } from "@/src/lib/auth-client";
import { setupSchema } from "@next-phish/shared";
import { toFormikValidation } from "@/src/lib/to-formik-validation";
import { SetupPresentation } from "./presentation";

interface SetupValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export function SetupContainer() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function handleSubmit(values: SetupValues) {
    setError("");

    const { error: err } = await authClient.signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
    });

    if (err) {
      setError(err.message || err.code || "Failed to create account");
      return;
    }

    router.push("/login");
  }

  return (
    <Formik<SetupValues>
      initialValues={{ name: "", email: "", password: "", confirmPassword: "" }}
      validate={toFormikValidation(setupSchema)}
      onSubmit={handleSubmit}
    >
      <SetupPresentation error={error} />
    </Formik>
  );
}
