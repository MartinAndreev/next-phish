"use client";

import { Formik } from "formik";
import {
  ignoredNetworkSchema,
  type IgnoredNetworkInput,
} from "@next-phish/shared";
import { IgnoredNetworksPresentation } from "@/src/components/organisms/organization-settings/ignored-networks-presentation";
import { useFormStatus } from "@/src/hooks/use-form-status";
import { toFormikValidation } from "@/src/lib/to-formik-validation";
import { trpc } from "@/src/lib/trpc";
import { useTranslation } from "@/src/lib/i18n";

export function GlobalIgnoredNetworksContainer() {
  const t = useTranslation();
  const utils = trpc.useUtils();
  const { status, setError, setSuccess, reset } = useFormStatus();
  const { data: networks = [], isLoading } =
    trpc.settings.listIgnoredNetworks.useQuery();
  const create = trpc.settings.createIgnoredNetwork.useMutation();
  const remove = trpc.settings.deleteIgnoredNetwork.useMutation();

  async function refresh() {
    await utils.settings.listIgnoredNetworks.invalidate();
  }

  async function handleSubmit(
    values: IgnoredNetworkInput,
    helpers: { resetForm: () => void },
  ) {
    reset();
    try {
      await create.mutateAsync({
        network: values.network,
        description: values.description || undefined,
      });
      helpers.resetForm();
      await refresh();
      setSuccess(t("settings.globalIgnoredNetworkAdded"));
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : t("settings.globalIgnoredNetworkError"),
      );
    }
  }

  async function handleDelete(id: string) {
    reset();
    try {
      await remove.mutateAsync({ id });
      await refresh();
      setSuccess(t("settings.globalIgnoredNetworkRemoved"));
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : t("settings.globalIgnoredNetworkDeleteError"),
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
        title={t("settings.globalIgnoredNetworks")}
        hint={t("settings.globalIgnoredNetworksHint")}
        isLoading={isLoading}
        deletingId={remove.isPending ? remove.variables?.id : undefined}
        status={status}
        onDelete={handleDelete}
      />
    </Formik>
  );
}
