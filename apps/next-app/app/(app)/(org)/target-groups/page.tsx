"use client";

import { useRouter } from "next/navigation";
import { BreadCrumb } from "primereact/breadcrumb";
import { Badge } from "primereact/badge";
import { Button } from "primereact/button";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import type { TargetGroupListItemView } from "@next-phish/shared";
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

export default function TargetGroupsPage() {
  const t = useTranslation();
  const router = useRouter();
  const utils = trpc.useUtils();
  const { setSearch, setSorts, setFilterValues, setPage, buildQueryInput } =
    useDataTable();

  const queryInput = buildQueryInput([
    "name",
    "status",
    "createdAt",
    "updatedAt",
  ]);
  const { data, isLoading } = trpc.targetGroup.list.useQuery(queryInput);

  const deleteMutation = trpc.targetGroup.delete.useMutation({
    onSuccess: () => {
      utils.targetGroup.list.invalidate();
    },
  });

  const breadcrumbItems = [{ label: t("targetGroups.title") }];
  const targetGroups = data?.targetGroups ?? [];
  const total = data?.total ?? 0;

  const columns: DataTableColumn<TargetGroupListItemView>[] = [
    {
      field: "name",
      header: t("targetGroups.name"),
      sortable: true,
    },
    {
      field: "status",
      header: t("targetGroups.status"),
      sortable: true,
      body: (group) => {
        const severityMap: Record<string, "success" | "secondary" | "warning"> =
          {
            ACTIVE: "success",
            DRAFT: "secondary",
            ARCHIVED: "warning",
          };
        const labelMap: Record<string, string> = {
          ACTIVE: t("common.active"),
          DRAFT: t("common.draft"),
          ARCHIVED: t("targetGroups.archived"),
        };
        return (
          <Badge
            value={labelMap[group.status] ?? group.status}
            severity={severityMap[group.status] ?? "secondary"}
          />
        );
      },
    },
    {
      field: "userCount",
      header: t("targetGroups.userCount"),
      sortable: false,
      body: (group) => group.userCount.toLocaleString(),
    },
    {
      field: "createdById",
      header: t("targetGroups.createdBy"),
      body: (group) => group.createdBy.name,
    },
    {
      field: "updatedAt",
      header: t("targetGroups.updatedAt"),
      sortable: true,
      body: (group) => new Date(group.updatedAt).toLocaleDateString(),
    },
  ];

  const filters: DataTableFilter[] = [
    {
      field: "status",
      label: t("targetGroups.status"),
      type: "select",
      options: [
        { label: t("common.draft"), value: "DRAFT" },
        { label: t("common.active"), value: "ACTIVE" },
        { label: t("targetGroups.archived"), value: "ARCHIVED" },
      ],
    },
  ];

  const actions: DataTableAction<TargetGroupListItemView>[] = [
    {
      label: t("targetGroups.editGroup"),
      icon: "pi pi-pencil",
      onClick: (group) => router.push(`/target-groups/${group.id}`),
    },
    {
      label: t("targetGroups.delete"),
      icon: "pi pi-trash",
      severity: "danger",
      onClick: (group) => {
        confirmDialog({
          message: t("targetGroups.deleteConfirm", { name: group.name }),
          header: t("targetGroups.deleteTitle"),
          icon: "pi pi-exclamation-triangle",
          accept: () => deleteMutation.mutate({ id: group.id }),
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
            {t("targetGroups.title")}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            {t("targetGroups.subtitle")}
          </p>
        </div>

        <Button
          type="button"
          size="small"
          label={t("targetGroups.newGroup")}
          icon="pi pi-plus"
          onClick={() => router.push("/target-groups/new")}
          className="rounded-xl border-0 bg-(image:--brand-gradient) px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(41,184,255,0.25)]"
        />
      </div>

      <AppDataTable
        data={targetGroups}
        total={total}
        columns={columns}
        dataKey="id"
        loading={isLoading}
        searchPlaceholder={t("targetGroups.searchGroups")}
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
