"use client";

import { Formik, type FormikHelpers } from "formik";
import { z } from "zod";
import { trpc } from "@/src/lib/trpc";
import { toFormikValidation } from "@/src/lib/to-formik-validation";
import { useFormStatus } from "@/src/hooks/use-form-status";
import { CreateApiKeyPresentation } from "./presentation";

const createApiKeySchema = z.object({
  name: z.string().max(32).optional(),
  limitToOrganizations: z.boolean(),
  organizationIds: z.array(z.string()),
  permissions: z.any(),
  expiresInDays: z.number().int().min(1).max(365).nullable(),
});

interface CreateApiKeyValues {
  name: string;
  limitToOrganizations: boolean;
  organizationIds: string[];
  permissions: Record<string, boolean>;
  expiresInDays: number | null;
}

interface CreateApiKeyContainerProps {
  visible: boolean;
  onHide: () => void;
  onCreated: (key: string) => void;
}

export function CreateApiKeyContainer({
  visible,
  onHide,
  onCreated,
}: CreateApiKeyContainerProps) {
  const { status, setError, reset } = useFormStatus();

  const { data: orgData } = trpc.organization.list.useQuery({
    limit: 100,
    offset: 0,
  });
  const organizations = orgData?.organizations ?? [];

  const createMutation = trpc.apiKey.create.useMutation({
    onSuccess: (data) => {
      if (data?.key) {
        onCreated(data.key);
        reset();
      }
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  function handleSubmit(
    values: CreateApiKeyValues,
    formikHelpers: FormikHelpers<CreateApiKeyValues>,
  ) {
    const permissions: Record<string, string[]> = {};
    for (const [scope, enabled] of Object.entries(values.permissions)) {
      if (enabled) {
        const [action, resource] = scope.split(":");
        if (!permissions[resource]) {
          permissions[resource] = [];
        }
        permissions[resource].push(action);
      }
    }

    createMutation.mutate(
      {
        name: values.name || undefined,
        organizationIds:
          values.limitToOrganizations && values.organizationIds.length > 0
            ? values.organizationIds
            : undefined,
        expiresInDays: values.expiresInDays ?? undefined,
        permissions:
          Object.keys(permissions).length > 0 ? permissions : undefined,
      },
      {
        onError: () => formikHelpers.setSubmitting(false),
      },
    );
  }

  function handleHide() {
    reset();
    onHide();
  }

  return (
    <Formik<CreateApiKeyValues>
      initialValues={{
        name: "",
        limitToOrganizations: false,
        organizationIds: [],
        permissions: {},
        expiresInDays: 90,
      }}
      validate={toFormikValidation(createApiKeySchema)}
      onSubmit={handleSubmit}
    >
      <CreateApiKeyPresentation
        visible={visible}
        onHide={handleHide}
        error={status.type === "error" ? status.message : ""}
        organizations={organizations}
      />
    </Formik>
  );
}
