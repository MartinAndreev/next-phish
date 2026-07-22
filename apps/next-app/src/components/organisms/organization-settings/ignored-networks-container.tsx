"use client";

import { Formik } from "formik";
import {
  ignoredNetworkSchema,
  type IgnoredNetworkInput,
} from "@next-phish/shared";
import { useFormStatus } from "@/src/hooks/use-form-status";
import { toFormikValidation } from "@/src/lib/to-formik-validation";
import { trpc } from "@/src/lib/trpc";
import { useTranslation } from "@/src/lib/i18n";
import { IgnoredNetworksPresentation } from "./ignored-networks-presentation";

interface IgnoredNetworksContainerProps {
  organizationId: string;
}

export function IgnoredNetworksContainer({
  organizationId,
}: IgnoredNetworksContainerProps) {
  const t = useTranslation();
  const utils = trpc.useUtils();
  const { status, setError, setSuccess, reset } = useFormStatus();
  const { data: networks = [], isLoading } =
    trpc.organization.listIgnoredNetworks.useQuery({ organizationId });

  const create = trpc.organization.createIgnoredNetwork.useMutation();
  const remove = trpc.organization.deleteIgnoredNetwork.useMutation();

  async function refresh() {
    await utils.organization.listIgnoredNetworks.invalidate({ organizationId });
  }

  async function handleSubmit(
    values: IgnoredNetworkInput,
    helpers: { resetForm: () => void },
  ) {
    reset();
    try {
      await create.mutateAsync({
        organizationId,
        network: values.network,
        description: values.description || undefined,
      });
      helpers.resetForm();
      await refresh();
      setSuccess(t("organizations.ignoredNetworkAdded"));
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : t("organizations.ignoredNetworkError"),
      );
    }
  }

  async function handleDelete(id: string) {
    reset();
    try {
      await remove.mutateAsync({ organizationId, id });
      await refresh();
      setSuccess(t("organizations.ignoredNetworkRemoved"));
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : t("organizations.ignoredNetworkDeleteError"),
      );
    }
  }

  return (
    <Formik<IgnoredNetworkInput>
      initialValues={{ network: "", description: "" }}
      validate={toFormikValidation(ignoredNetworkSchema)}
      onSubmit={handleSubmit}
    >
      <IgnoredNetworksPresentation
        networks={networks}
        isLoading={isLoading}
        deletingId={remove.isPending ? remove.variables?.id : undefined}
        status={status}
        onDelete={handleDelete}
      />
    </Formik>
  );
}
