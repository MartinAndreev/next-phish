"use client";

import { useRouter } from "next/navigation";
import { Formik } from "formik";
import { z } from "zod";
import { trpc } from "@/src/lib/trpc";
import { toFormikValidation } from "@/src/lib/to-formik-validation";
import { useFormStatus } from "@/src/hooks/use-form-status";
import { InitialPasswordPresentation } from "./presentation";

const schema = z
  .object({
    password: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your password"),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type Values = z.infer<typeof schema>;

export function InitialPasswordContainer() {
  const router = useRouter();
  const mutation = trpc.user.setInitialPassword.useMutation();
  const { status, setError } = useFormStatus();

  async function submit(values: Values) {
    setError("");
    try {
      await mutation.mutateAsync(values);
      router.push("/");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not set your password",
      );
    }
  }

  return (
    <Formik<Values>
      initialValues={{ password: "", confirmPassword: "" }}
      validate={toFormikValidation(schema)}
      onSubmit={submit}
    >
      <InitialPasswordPresentation
        error={status.type === "error" ? status.message : ""}
      />
    </Formik>
  );
}
