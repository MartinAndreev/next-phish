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

const breadcrumbHome = { icon: "pi pi-home", url: "/" };
const breadcrumbItems = [{ label: "Organizations" }];

const columns: DataTableColumn<OrganizationView>[] = [
  { field: "name", header: "Name", sortable: true },
  { field: "slug", header: "Slug", sortable: true },
  {
    field: "$me",
    header: "Role",
    body: (org) => {
      const severity =
        org.$me.role === "owner"
          ? "success"
          : org.$me.role === "admin"
            ? "info"
            : "secondary";
      return <Badge value={org.$me.role} severity={severity} />;
    },
  },
  {
    field: "createdAt",
    header: "Created",
    sortable: true,
    body: (org) => new Date(org.createdAt).toLocaleDateString(),
  },
];

const filters: DataTableFilter[] = [
  {
    field: "role",
    label: "Role",
    type: "select",
    options: [
      { label: "Owner", value: "owner" },
      { label: "Admin", value: "admin" },
      { label: "Member", value: "member" },
    ],
  },
];

export default function OrganizationsPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { setSearch, setSorts, setFilterValues, setPage, buildQueryInput } =
    useDataTable();

  const queryInput = buildQueryInput(["name", "slug", "createdAt"]);
  const { data, isLoading } = trpc.organization.list.useQuery(queryInput);

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
      label: "Manage",
      icon: "pi pi-cog",
      onClick: (org) => router.push(`/organizations/${org.id}`),
    },
    {
      label: "Delete",
      icon: "pi pi-trash",
      severity: "danger",
      visible: (org) => org.$me.role === "owner" && ownedOrgCount > 1,
      onClick: (org) => {
        confirmDialog({
          message: `Are you sure you want to delete "${org.name}"? This action cannot be undone.`,
          header: "Delete organization",
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
          Organizations
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Manage your organizations and team access.
        </p>
      </div>

      <AppDataTable
        data={organizations}
        total={total}
        columns={columns}
        dataKey="id"
        loading={isLoading}
        searchPlaceholder="Search organizations..."
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
