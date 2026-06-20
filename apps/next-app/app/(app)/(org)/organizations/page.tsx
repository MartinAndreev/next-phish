"use client";

import { useRouter } from "next/navigation";
import { BreadCrumb } from "primereact/breadcrumb";
import { Badge } from "primereact/badge";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { AppDataTable } from "@/src/components/molecules/data-table";
import type {
  DataTableAction,
  DataTableColumn,
  DataTableFilter,
} from "@/src/components/molecules/data-table";
import { useDataTable } from "@/src/hooks/use-data-table";
import { trpc } from "@/src/lib/trpc";
import type { OrganizationView } from "@next-phish/backend";
import { useTranslation } from "@/src/lib/i18n";

const breadcrumbHome = { icon: "pi pi-home", url: "/" };

export default function OrganizationsPage() {
  const t = useTranslation();
  const router = useRouter();
  const utils = trpc.useUtils();
  const { setSearch, setSorts, setFilterValues, setPage, buildQueryInput } =
    useDataTable();

  const queryInput = buildQueryInput(["name", "slug", "createdAt"]);
  const { data, isLoading } = trpc.organization.list.useQuery(queryInput);

  const roleLabel = (role: OrganizationView["$me"]["role"]) => {
    switch (role) {
      case "owner":
        return t("common.owner");
      case "admin":
        return t("common.admin");
      default:
        return t("common.member");
    }
  };

  const breadcrumbItems = [{ label: t("organizations.title") }];

  const columns: DataTableColumn<OrganizationView>[] = [
    { field: "name", header: t("organizations.name"), sortable: true },
    { field: "slug", header: t("organizations.slug"), sortable: true },
    {
      field: "$me",
      header: t("organizations.role"),
      body: (org) => {
        const severity =
          org.$me.role === "owner"
            ? "success"
            : org.$me.role === "admin"
              ? "info"
              : "secondary";
        return <Badge value={roleLabel(org.$me.role)} severity={severity} />;
      },
    },
    {
      field: "createdAt",
      header: t("organizations.created"),
      sortable: true,
      body: (org) => new Date(org.createdAt).toLocaleDateString(),
    },
  ];

  const filters: DataTableFilter[] = [
    {
      field: "role",
      label: t("organizations.role"),
      type: "select",
      options: [
        { label: t("common.owner"), value: "owner" },
        { label: t("common.admin"), value: "admin" },
        { label: t("common.member"), value: "member" },
      ],
    },
  ];

  const deleteMutation = trpc.organization.delete.useMutation({
    onSuccess: () => {
      utils.organization.list.invalidate();
    },
  });

  const organizations = data?.organizations ?? [];
  const total = data?.total ?? 0;

  const ownedOrgCount = organizations.filter(
    (org) => org.$me.role === "owner",
  ).length;

  const actions: DataTableAction<OrganizationView>[] = [
    {
      label: t("organizations.manage"),
      icon: "pi pi-cog",
      onClick: (org) => router.push(`/organizations/${org.id}`),
    },
    {
      label: t("organizations.delete"),
      icon: "pi pi-trash",
      severity: "danger",
      visible: (org) => org.$me.role === "owner" && ownedOrgCount > 1,
      onClick: (org) => {
        confirmDialog({
          message: t("organizations.deleteConfirm", { name: org.name }),
          header: t("organizations.deleteTitle"),
          icon: "pi pi-exclamation-triangle",
          accept: () => {
            deleteMutation.mutate({ organizationId: org.id });
          },
        });
      },
    },
  ];

  return (
    <div className="px-6 py-8">
      <div className="mb-6">
        <BreadCrumb home={breadcrumbHome} model={breadcrumbItems} />
        <h1 className="mt-2 text-2xl font-semibold text-white">
          {t("organizations.title")}
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          {t("organizations.subtitle")}
        </p>
      </div>

      <AppDataTable
        data={organizations}
        total={total}
        columns={columns}
        dataKey="id"
        loading={isLoading}
        searchPlaceholder={t("organizations.searchOrganizations")}
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
