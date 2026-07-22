"use client";

import { Formik } from "formik";
import type { OrganizationView } from "@next-phish/backend";
import {
  updateOrganizationSchema,
  type UpdateOrganizationInput,
} from "@next-phish/shared";
import { useFormStatus } from "@/src/hooks/use-form-status";
import { toFormikValidation } from "@/src/lib/to-formik-validation";
import { trpc } from "@/src/lib/trpc";
import { useTranslation } from "@/src/lib/i18n";
import { GeneralFormPresentation } from "./general-form-presentation";

interface GeneralFormContainerProps {
  organization: OrganizationView;
}

export function GeneralFormContainer({
  organization,
}: GeneralFormContainerProps) {
  const t = useTranslation();
  const utils = trpc.useUtils();
  const { status, setError, setSuccess, reset } = useFormStatus();
  const update = trpc.organization.update.useMutation();

  async function handleSubmit(values: UpdateOrganizationInput) {
    reset();
    try {
      await update.mutateAsync({ organizationId: organization.id, ...values });
      await Promise.all([
        utils.organization.getById.invalidate({
          organizationId: organization.id,
        }),
        utils.organization.list.invalidate(),
      ]);
      setSuccess(t("organizations.updated"));
    } catch (error) {
      setError(
        error instanceof Error ? error.message : t("organizations.updateError"),
      );
    }
  }

  return (
    <Formik<UpdateOrganizationInput>
      enableReinitialize
      initialValues={{ name: organization.name, slug: organization.slug }}
      validate={toFormikValidation(updateOrganizationSchema)}
      onSubmit={handleSubmit}
    >
      <GeneralFormPresentation status={status} />
    </Formik>
  );
}
