"use client";

import { Form, useFormikContext } from "formik";
import { Button } from "primereact/button";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import type { IgnoredNetworkInput } from "@next-phish/shared";
import type { FormStatus } from "@/src/hooks/use-form-status";
import { FormMessage } from "@/src/components/atoms/form-message";
import { FormField } from "@/src/components/molecules/form-field";
import { useTranslation } from "@/src/lib/i18n";

interface IgnoredNetwork {
  id: string;
  network: string;
  normalizedNetwork: string;
  description: string | null;
  createdAt: Date;
}

interface IgnoredNetworksPresentationProps {
  networks: IgnoredNetwork[];
  title?: string;
  hint?: string;
  isLoading: boolean;
  deletingId?: string;
  status: FormStatus;
  onDelete: (id: string) => Promise<void>;
}

export function IgnoredNetworksPresentation({
  networks,
  title,
  hint,
  isLoading,
  deletingId,
  status,
  onDelete,
}: IgnoredNetworksPresentationProps) {
  const t = useTranslation();
  const { isSubmitting } = useFormikContext<IgnoredNetworkInput>();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-white">
          {title ?? t("organizations.ignoredNetworks")}
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-zinc-400">
          {hint ?? t("organizations.ignoredNetworksHint")}
        </p>
      </div>

      <Form className="grid max-w-3xl gap-4 md:grid-cols-[1fr_1fr_auto] md:items-start">
        <FormField
          name="network"
          label={t("organizations.ipOrNetwork")}
          placeholder="192.0.2.10 or 10.0.0.0/8"
          inputClassName="rounded-xl border-white/10 bg-white/95 text-slate-900"
        />
        <FormField
          name="description"
          label={t("organizations.description")}
          placeholder={t("organizations.descriptionPlaceholder")}
          inputClassName="rounded-xl border-white/10 bg-white/95 text-slate-900"
        />
        <Button
          size="small"
          type="submit"
          icon="pi pi-plus"
          label={t("organizations.addIgnoredNetwork")}
          loading={isSubmitting}
          disabled={isSubmitting}
          className="mt-7 whitespace-nowrap rounded-xl border-0 bg-brand-blue text-white hover:bg-brand-azure"
        />
      </Form>

      {status.type === "error" && (
        <FormMessage variant="error">{status.message}</FormMessage>
      )}
      {status.type === "success" && (
        <FormMessage variant="success">{status.message}</FormMessage>
      )}

      <div className="overflow-hidden rounded-xl border border-white/10">
        {isLoading ? (
          <div className="p-6 text-sm text-zinc-400">{t("common.loading")}</div>
        ) : networks.length === 0 ? (
          <div className="p-6 text-sm text-zinc-400">
            {t("organizations.noIgnoredNetworks")}
          </div>
        ) : (
          <ul className="divide-y divide-white/10">
            {networks.map((network) => (
              <li
                key={network.id}
                className="flex flex-col gap-3 bg-white/3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <code className="text-sm font-semibold text-brand-cyan">
                    {network.normalizedNetwork}
                  </code>
                  {network.description && (
                    <p className="mt-1 text-sm text-zinc-300">
                      {network.description}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-zinc-500">
                    {t("organizations.addedOn", {
                      date: new Date(network.createdAt)
                        .toISOString()
                        .slice(0, 10),
                    })}
                  </p>
                </div>
                <Button
                  type="button"
                  size="small"
                  severity="danger"
                  outlined
                  icon="pi pi-trash"
                  label={t("organizations.remove")}
                  loading={deletingId === network.id}
                  disabled={Boolean(deletingId)}
                  onClick={() =>
                    confirmDialog({
                      header: t("organizations.removeIgnoredNetworkTitle"),
                      message: t("organizations.removeIgnoredNetworkConfirm", {
                        network: network.normalizedNetwork,
                      }),
                      icon: "pi pi-exclamation-triangle",
                      accept: () => void onDelete(network.id),
                    })
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog draggable={false} dismissableMask />
    </div>
  );
}
