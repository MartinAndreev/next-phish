"use client";

import { useCallback, useState } from "react";
import { Formik, type FormikHelpers } from "formik";
import { z } from "zod";
import { trpc } from "@/src/lib/trpc";
import { toFormikValidation } from "@/src/lib/to-formik-validation";
import { useFormStatus } from "@/src/hooks/use-form-status";
import { ApiKeyForm } from "./api-key-form";

const createApiKeySchema = z.object({
  name: z.string().max(32).optional(),
  limitToOrganizations: z.boolean(),
  organizationIds: z.array(z.string()),
  permissions: z.any(),
  expiresInDays: z.number().int().min(1).max(365).nullable(),
  rateLimitEnabled: z.boolean(),
  rateLimitMax: z.number().int().min(1).nullable(),
  rateLimitTimeWindow: z.number().int().min(1000).nullable(),
});

interface CreateApiKeyValues {
  name: string;
  limitToOrganizations: boolean;
  organizationIds: string[];
  permissions: Record<string, boolean>;
  expiresInDays: number | null;
  rateLimitEnabled: boolean;
  rateLimitMax: number | null;
  rateLimitTimeWindow: number | null;
}

interface CreateApiKeyContainerProps {
  visible: boolean;
  onHide: () => void;
  onCreated: (key: string) => void;
}

export function ApiKeyFormContainer({
  visible,
  onHide,
  onCreated,
}: CreateApiKeyContainerProps) {
  const { status, setError, reset } = useFormStatus();
  const [formKey, setFormKey] = useState(0);

  const { data: orgData } = trpc.organization.list.useQuery({
    limit: 100,
    offset: 0,
  });
  const organizations = orgData?.organizations ?? [];

  const createMutation = trpc.apiKey.create.useMutation({
    onSuccess: (data) => {
      const result = data as { key?: string } | null;
      if (result?.key) {
        onCreated(result.key);
        reset();
        setFormKey((k) => k + 1);
      }
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const handleSubmit = useCallback(
    (
      values: CreateApiKeyValues,
      formikHelpers: FormikHelpers<CreateApiKeyValues>,
    ) => {
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
          rateLimitEnabled: values.rateLimitEnabled,
          rateLimitMax: values.rateLimitEnabled
            ? (values.rateLimitMax ?? undefined)
            : undefined,
          rateLimitTimeWindow: values.rateLimitEnabled
            ? (values.rateLimitTimeWindow ?? undefined)
            : undefined,
        },
        {
          onError: () => formikHelpers.setSubmitting(false),
        },
      );
    },
    [createMutation],
  );

  const handleHide = useCallback(() => {
    reset();
    setFormKey((k) => k + 1);
    onHide();
  }, [reset, onHide]);

  return (
    <Formik<CreateApiKeyValues>
      key={formKey}
      initialValues={{
        name: "",
        limitToOrganizations: false,
        organizationIds: [],
        permissions: {},
        expiresInDays: 90,
        rateLimitEnabled: true,
        rateLimitMax: 1000,
        rateLimitTimeWindow: 3600000,
      }}
      validate={toFormikValidation(createApiKeySchema)}
      onSubmit={handleSubmit}
    >
      <ApiKeyForm
        visible={visible}
        onHide={handleHide}
        error={status.type === "error" ? status.message : ""}
        organizations={organizations}
      />
    </Formik>
  );
}
