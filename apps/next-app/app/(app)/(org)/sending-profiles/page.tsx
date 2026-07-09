"use client";

import { useRouter } from "next/navigation";
import { BreadCrumb } from "primereact/breadcrumb";
import { Badge } from "primereact/badge";
import { Button } from "primereact/button";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import type { MailSendingProfileView } from "@next-phish/backend";
import { AppDataTable } from "@/src/components/molecules/data-table";
import type {
  DataTableAction,
  DataTableColumn,
  DataTableFilter,
} from "@/src/components/molecules/data-table";
import { useDataTable } from "@/src/hooks/use-data-table";
import { useTranslation } from "@/src/lib/i18n";
import { trpc } from "@/src/lib/trpc";

const breadcrumbHome = { icon: "pi pi-home", url: "/" };

const PROVIDER_LABELS: Record<string, string> = {
  SMTP: "SMTP",
  MICROSOFT_GRAPH: "Microsoft Graph",
  AWS_SES: "AWS SES",
  SENDGRID: "SendGrid",
  MAILGUN: "Mailgun",
  POSTMARK: "Postmark",
  RESEND: "Resend",
  GENERAL_API: "General API",
};

export default function SendingProfilesPage() {
  const t = useTranslation();
  const router = useRouter();
  const utils = trpc.useUtils();
  const { setSearch, setSorts, setFilterValues, setPage, buildQueryInput } =
    useDataTable();

  const queryInput = buildQueryInput([
    "name",
    "providerType",
    "createdAt",
    "updatedAt",
  ]);
  const { data, isLoading } = trpc.mailSending.list.useQuery(queryInput);

  const deleteMutation = trpc.mailSending.delete.useMutation({
    onSuccess: () => {
      utils.mailSending.list.invalidate();
    },
  });

  const breadcrumbItems = [{ label: t("sendingProfiles.title") }];
  const profiles = data?.profiles ?? [];
  const total = data?.total ?? 0;

  const columns: DataTableColumn<MailSendingProfileView>[] = [
    {
      field: "name",
      header: t("sendingProfiles.name"),
      sortable: true,
    },
    {
      field: "providerType",
      header: t("sendingProfiles.providerType"),
      sortable: true,
      body: (profile) =>
        PROVIDER_LABELS[profile.providerType] ?? profile.providerType,
    },
    {
      field: "fromEmail",
      header: t("common.email"),
      body: (profile) => (
        <span className="text-sm">
          {profile.fromName} &lt;{profile.fromEmail}&gt;
        </span>
      ),
    },
    {
      field: "isDefault",
      header: t("sendingProfiles.isDefault"),
      body: (profile) =>
        profile.isDefault ? (
          <Badge value={t("common.active")} severity="success" />
        ) : null,
    },
    {
      field: "updatedAt",
      header: t("emailTemplates.updatedAt"),
      sortable: true,
      body: (profile) => new Date(profile.updatedAt).toLocaleDateString(),
    },
  ];

  const filters: DataTableFilter[] = [
    {
      field: "providerType",
      label: t("sendingProfiles.providerType"),
      type: "select",
      options: Object.entries(PROVIDER_LABELS).map(([value, label]) => ({
        label,
        value,
      })),
    },
  ];

  const actions: DataTableAction<MailSendingProfileView>[] = [
    {
      label: t("sendingProfiles.editProfile"),
      icon: "pi pi-pencil",
      onClick: (profile) => router.push(`/sending-profiles/${profile.id}`),
    },
    {
      label: t("sendingProfiles.delete"),
      icon: "pi pi-trash",
      severity: "danger",
      onClick: (profile) => {
        confirmDialog({
          message: t("sendingProfiles.deleteConfirm", { name: profile.name }),
          header: t("sendingProfiles.deleteTitle"),
          icon: "pi pi-exclamation-triangle",
          accept: () => deleteMutation.mutate({ id: profile.id }),
        });
      },
    },
  ];

  return (
    <div className="px-6 py-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <BreadCrumb home={breadcrumbHome} model={breadcrumbItems} />
          <h1 className="mt-2 text-2xl font-semibold text-white">
            {t("sendingProfiles.title")}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            {t("sendingProfiles.subtitle")}
          </p>
        </div>

        <Button
          type="button"
          size="small"
          label={t("sendingProfiles.newProfile")}
          icon="pi pi-plus"
          onClick={() => router.push("/sending-profiles/new")}
          className="rounded-xl border-0 bg-(image:--brand-gradient) px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(41,184,255,0.25)]"
        />
      </div>

      <AppDataTable
        data={profiles}
        total={total}
        columns={columns}
        dataKey="id"
        loading={isLoading}
        searchPlaceholder={t("sendingProfiles.searchProfiles")}
        filters={filters}
        actions={actions}
        onSearch={setSearch}
        onSort={setSorts}
        onFilter={setFilterValues}
        onPage={(offset, limit) => setPage({ offset: offset * limit, limit })}
      />

      <ConfirmDialog
        className="max-w-md"
        draggable={false}
        dismissableMask={true}
      />
    </div>
  );
}
