"use client";

import { useState } from "react";
import { BreadCrumb } from "primereact/breadcrumb";
import { Badge } from "primereact/badge";
import { AppDataTable } from "@/src/components/molecules/data-table";
import type {
  DataTableColumn,
  DataTableFilter,
  DataTableSort,
} from "@/src/components/molecules/data-table";
import { trpc } from "@/src/lib/trpc";
import type { OrganizationView } from "@next-phish/backend";

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

const breadcrumbHome = { icon: "pi pi-home", url: "/" };

export default function OrganizationsPage() {
  const [search, setSearch] = useState("");
  const [sorts, setSorts] = useState<DataTableSort[]>([]);
  const [filterValues, setFilterValues] = useState<Record<string, unknown>>({});
  const [page, setPage] = useState({ offset: 0, limit: 10 });

  const { data, isLoading } = trpc.organization.list.useQuery({
    search: search || undefined,
    limit: page.limit,
    offset: page.offset,
    sort:
      sorts.length > 0
        ? sorts.map((s) => ({
            field: s.field as "name" | "slug" | "createdAt",
            order: s.order,
          }))
        : undefined,
    filters: filterValues.role
      ? { role: filterValues.role as string }
      : undefined,
  });

  const breadcrumbItems = [{ label: "Organizations" }];

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
        data={data?.organizations ?? []}
        total={data?.total ?? 0}
        columns={columns}
        dataKey="id"
        loading={isLoading}
        searchPlaceholder="Search organizations..."
        filters={filters}
        onSearch={setSearch}
        onSort={setSorts}
        onFilter={setFilterValues}
        onPage={(offset, limit) => setPage({ offset: offset * limit, limit })}
      />
    </div>
  );
}
