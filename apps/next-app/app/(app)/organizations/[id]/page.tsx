"use client";

import { useParams } from "next/navigation";
import { BreadCrumb } from "primereact/breadcrumb";
import { Badge } from "primereact/badge";
import { AppDataTable } from "@/src/components/molecules/data-table";
import type {
  DataTableColumn,
  DataTableFilter,
} from "@/src/components/molecules/data-table";
import { CampaignsChart } from "@/src/components/molecules/charts";
import { EmailStatsChart } from "@/src/components/molecules/charts";
import { useDataTable } from "@/src/hooks/use-data-table";
import { trpc } from "@/src/lib/trpc";
import type { MemberView } from "@next-phish/backend";

const memberColumns: DataTableColumn<MemberView>[] = [
  {
    field: "userId",
    header: "Name",
    body: (member) => member.user.name,
  },
  {
    field: "id",
    header: "Email",
    body: (member) => member.user.email,
  },
  {
    field: "role",
    header: "Role",
    sortable: true,
    body: (member) => {
      const severity =
        member.role === "owner"
          ? "success"
          : member.role === "admin"
            ? "info"
            : "secondary";
      return <Badge value={member.role} severity={severity} />;
    },
  },
  {
    field: "createdAt",
    header: "Joined",
    sortable: true,
    body: (member) => new Date(member.createdAt).toLocaleDateString(),
  },
];

const memberFilters: DataTableFilter[] = [
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

export default function OrganizationManagerPage() {
  const params = useParams();
  const id = params.id as string;

  const { setSearch, setSorts, setFilterValues, setPage, buildQueryInput } =
    useDataTable();

  const membersQueryInput = buildQueryInput(["role", "createdAt"]);

  const { data: org, isLoading: orgLoading } =
    trpc.organization.getById.useQuery({ organizationId: id });

  const { data: membersData, isLoading: membersLoading } =
    trpc.organization.listMembers.useQuery({
      organizationId: id,
      ...membersQueryInput,
    });

  const members = membersData?.members ?? [];
  const membersTotal = membersData?.total ?? 0;

  const breadcrumbHome = { icon: "pi pi-home", url: "/" };
  const breadcrumbItems = [
    { label: "Organizations", url: "/organizations" },
    { label: org?.name ?? "Loading..." },
  ];

  if (orgLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-zinc-400">Organization not found.</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-8">
      <div className="mb-6">
        <BreadCrumb home={breadcrumbHome} model={breadcrumbItems} />
        <h1 className="mt-2 text-2xl font-semibold text-white">{org.name}</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Manage your organization settings and view analytics.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CampaignsChart />
        <EmailStatsChart />
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">Members</h2>
        <AppDataTable
          data={members}
          total={membersTotal}
          columns={memberColumns}
          dataKey="id"
          loading={membersLoading}
          searchPlaceholder="Search members..."
          filters={memberFilters}
          onSearch={setSearch}
          onSort={setSorts}
          onFilter={setFilterValues}
          onPage={(offset, limit) => setPage({ offset: offset * limit, limit })}
        />
      </div>
    </div>
  );
}
