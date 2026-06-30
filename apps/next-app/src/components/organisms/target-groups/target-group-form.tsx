"use client";

import { Formik, Form } from "formik";
import { Button } from "primereact/button";
import { useRouter } from "next/navigation";
import { toFormikValidation } from "@/src/lib/to-formik-validation";
import { useFormStatus } from "@/src/hooks/use-form-status";
import { useTranslation } from "@/src/lib/i18n";
import { trpc } from "@/src/lib/trpc";
import { TargetGroupFormPresentation } from "./target-group-form-presentation";
import {
  createTargetGroupSchema,
  updateTargetGroupSchema,
} from "@next-phish/shared";

interface TargetGroupFormProps {
  mode?: "create" | "edit";
  groupId?: string;
  initialName?: string;
  initialStatus?: string;
  onSuccess?: () => void;
}

export function TargetGroupForm({
  mode = "create",
  groupId,
  initialName = "",
  initialStatus = "DRAFT",
  onSuccess,
}: TargetGroupFormProps) {
  const t = useTranslation();
  const router = useRouter();
  const utils = trpc.useUtils();
  const { status, setError } = useFormStatus();

  const createMutation = trpc.targetGroup.create.useMutation({
    onSuccess: () => {
      utils.targetGroup.list.invalidate();
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/target-groups");
      }
    },
    onError: (err) => setError(err.message),
  });

  const updateMutation = trpc.targetGroup.update.useMutation({
    onSuccess: () => {
      utils.targetGroup.invalidate();
      onSuccess?.();
    },
    onError: (err) => setError(err.message),
  });

  async function handleSubmit(values: {
    name: string;
    status: string;
    users: Array<{
      email: string;
      firstName: string;
      lastName: string;
      position?: string;
    }>;
  }) {
    if (mode === "edit" && groupId) {
      updateMutation.mutate({
        id: groupId,
        name: values.name,
        status: values.status as "DRAFT" | "ACTIVE" | "ARCHIVED",
      });
    } else {
      createMutation.mutate({
        name: values.name,
        status: values.status as "DRAFT" | "ACTIVE" | "ARCHIVED",
        users: values.users.filter((u) => u.email && u.firstName && u.lastName),
      });
    }
  }

  const isEdit = mode === "edit";
  const schema = isEdit ? updateTargetGroupSchema : createTargetGroupSchema;

  return (
    <Formik
      initialValues={{
        name: initialName,
        status: initialStatus,
        users: [] as Array<{
          email: string;
          firstName: string;
          lastName: string;
          position: string;
        }>,
      }}
      validate={toFormikValidation(schema)}
      onSubmit={handleSubmit}
      enableReinitialize
    >
      {({ isSubmitting }) => (
        <Form className="flex flex-col gap-6">
          <TargetGroupFormPresentation
            error={status.type === "error" ? status.message : ""}
            isEdit={isEdit}
          />

          <div className="flex justify-end gap-3">
            {!onSuccess && (
              <Button
                size="small"
                type="button"
                label={t("common.cancel")}
                severity="secondary"
                onClick={() => router.push("/target-groups")}
              />
            )}
            <Button
              size="small"
              type="submit"
              label={isEdit ? t("common.saveChanges") : t("common.create")}
              loading={isSubmitting}
              className="rounded-xl border-0 bg-(image:--brand-gradient) px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(41,184,255,0.25)]"
            />
          </div>
        </Form>
      )}
    </Formik>
  );
}
