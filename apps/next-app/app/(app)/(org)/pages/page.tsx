"use client";

import { useRouter } from "next/navigation";
import { BreadCrumb } from "primereact/breadcrumb";
import { Badge } from "primereact/badge";
import { Button } from "primereact/button";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import type { PageListItemView } from "@next-phish/shared";
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

export default function PagesPage() {
  const t = useTranslation();
  const router = useRouter();
  const utils = trpc.useUtils();
  const { setSearch, setSorts, setFilterValues, setPage, buildQueryInput } =
    useDataTable();

  const queryInput = buildQueryInput(["name", "type", "status", "updatedAt"]);
  const { data, isLoading } = trpc.page.list.useQuery(queryInput);

  const deleteMutation = trpc.page.delete.useMutation({
    onSuccess: () => {
      utils.page.list.invalidate();
    },
  });

  const breadcrumbItems = [{ label: t("pages.title") }];
  const pages = data?.pages ?? [];
  const total = data?.total ?? 0;

  const columns: DataTableColumn<PageListItemView>[] = [
    {
      field: "name",
      header: t("pages.name"),
      sortable: true,
    },
    {
      field: "path",
      header: t("pages.path"),
      body: (page) => (
        <code className="text-xs text-zinc-300">/{page.path ?? "c"}</code>
      ),
    },
    {
      field: "type",
      header: t("pages.type"),
      sortable: true,
      body: (page) => (
        <Badge
          value={
            page.type === "LANDING"
              ? t("pages.typeLanding")
              : t("pages.typeRedirect")
          }
          severity={page.type === "LANDING" ? "info" : "warning"}
        />
      ),
    },
    {
      field: "status",
      header: t("pages.status"),
      sortable: true,
      body: (page) => (
        <Badge
          value={
            page.status === "ACTIVE" ? t("common.active") : t("common.draft")
          }
          severity={page.status === "ACTIVE" ? "success" : "secondary"}
        />
      ),
    },
    {
      field: "createdById",
      header: t("pages.createdBy"),
      body: (page) => page.createdBy.name,
    },
    {
      field: "updatedAt",
      header: t("pages.updatedAt"),
      sortable: true,
      body: (page) => new Date(page.updatedAt).toLocaleDateString(),
    },
  ];

  const filters: DataTableFilter[] = [
    {
      field: "status",
      label: t("pages.status"),
      type: "select",
      options: [
        { label: t("common.draft"), value: "DRAFT" },
        { label: t("common.active"), value: "ACTIVE" },
      ],
    },
    {
      field: "type",
      label: t("pages.type"),
      type: "select",
      options: [
        { label: t("pages.typeLanding"), value: "LANDING" },
        { label: t("pages.typeRedirect"), value: "REDIRECT" },
      ],
    },
  ];

  const actions: DataTableAction<PageListItemView>[] = [
    {
      label: t("pages.openEditor"),
      icon: "pi pi-pencil",
      onClick: (page) => router.push(`/pages/${page.id}`),
    },
    {
      label: t("pages.delete"),
      icon: "pi pi-trash",
      severity: "danger",
      onClick: (page) => {
        confirmDialog({
          message: t("pages.deleteConfirm", { name: page.name }),
          header: t("pages.deleteTitle"),
          icon: "pi pi-exclamation-triangle",
          accept: () => deleteMutation.mutate({ id: page.id }),
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
            {t("pages.title")}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">{t("pages.subtitle")}</p>
        </div>

        <Button
          type="button"
          size="small"
          label={t("pages.newPage")}
          icon="pi pi-plus"
          onClick={() => router.push("/pages/new")}
          className="rounded-xl border-0 bg-(image:--brand-gradient) px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(41,184,255,0.25)]"
        />
      </div>

      <AppDataTable
        data={pages}
        total={total}
        columns={columns}
        dataKey="id"
        loading={isLoading}
        searchPlaceholder={t("pages.searchPages")}
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
