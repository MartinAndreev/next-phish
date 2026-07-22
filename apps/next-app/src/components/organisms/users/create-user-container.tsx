"use client";

import { Formik } from "formik";
import { adminCreateUserSchema } from "@next-phish/shared";
import type { AdminCreateUserInput } from "@next-phish/shared";
import { trpc } from "@/src/lib/trpc";
import { toFormikValidation } from "@/src/lib/to-formik-validation";
import { useFormStatus } from "@/src/hooks/use-form-status";
import { CreateUserPresentation } from "./create-user-presentation";

export function CreateUserContainer({
  onCreated,
  onCancel,
}: {
  onCreated: () => void;
  onCancel: () => void;
}) {
  const utils = trpc.useUtils();
  const create = trpc.user.create.useMutation();
  const organizations = trpc.user.listOrganizations.useQuery();
  const { status, setError } = useFormStatus();

  async function submit(values: AdminCreateUserInput) {
    setError("");
    try {
      await create.mutateAsync({
        ...values,
        organizationId:
          values.organizationMode === "existing"
            ? values.organizationId
            : undefined,
      });
      await utils.user.list.invalidate();
      onCreated();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not create user",
      );
    }
  }

  return (
    <Formik<AdminCreateUserInput>
      initialValues={{
        name: "",
        email: "",
        role: "user",
        organizationMode: "self",
        organizationId: "",
      }}
      validate={toFormikValidation(adminCreateUserSchema)}
      onSubmit={submit}
    >
      <CreateUserPresentation
        organizations={organizations.data ?? []}
        error={status.type === "error" ? status.message : ""}
        onCancel={onCancel}
      />
    </Formik>
  );
}
