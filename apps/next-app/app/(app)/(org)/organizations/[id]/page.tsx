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
import { useTranslation } from "@/src/lib/i18n";

const breadcrumbHome = { icon: "pi pi-home", url: "/" };

export default function OrganizationManagerPage() {
  const t = useTranslation();
  const params = useParams();
  const id = params.id as string;

  const roleLabel = (role: MemberView["role"]) => {
    switch (role) {
      case "owner":
        return t("common.owner");
      case "admin":
        return t("common.admin");
      default:
        return t("common.member");
    }
  };

  const memberColumns: DataTableColumn<MemberView>[] = [
    {
      field: "userId",
      header: t("organizations.name"),
      body: (member) => member.user.name,
    },
    {
      field: "id",
      header: t("common.email"),
      body: (member) => member.user.email,
    },
    {
      field: "role",
      header: t("organizations.role"),
      sortable: true,
      body: (member) => {
        const severity =
          member.role === "owner"
            ? "success"
            : member.role === "admin"
              ? "info"
              : "secondary";
        return <Badge value={roleLabel(member.role)} severity={severity} />;
      },
    },
    {
      field: "createdAt",
      header: t("organizations.joined"),
      sortable: true,
      body: (member) => new Date(member.createdAt).toLocaleDateString(),
    },
  ];

  const memberFilters: DataTableFilter[] = [
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

  const breadcrumbItems = [
    { label: t("organizations.title"), url: "/organizations" },
    { label: org?.name ?? t("common.loading") },
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
        <p className="text-zinc-400">{t("organizations.notFound")}</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-8">
      <div className="mb-6">
        <BreadCrumb home={breadcrumbHome} model={breadcrumbItems} />
        <h1 className="mt-2 text-2xl font-semibold text-white">{org.name}</h1>
        <p className="mt-1 text-sm text-zinc-400">
          {t("organizations.detailSubtitle")}
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CampaignsChart />
        <EmailStatsChart />
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">
          {t("organizations.members")}
        </h2>
        <AppDataTable
          data={members}
          total={membersTotal}
          columns={memberColumns}
          dataKey="id"
          loading={membersLoading}
          searchPlaceholder={t("organizations.searchMembers")}
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
