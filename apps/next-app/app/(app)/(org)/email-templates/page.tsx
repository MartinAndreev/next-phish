"use client";

import { useRouter } from "next/navigation";
import { BreadCrumb } from "primereact/breadcrumb";
import { Badge } from "primereact/badge";
import { Button } from "primereact/button";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import type { EmailTemplateListItemView } from "@next-phish/backend";
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

export default function EmailTemplatesPage() {
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
  const { data, isLoading } = trpc.emailTemplate.list.useQuery(queryInput);

  const deleteMutation = trpc.emailTemplate.delete.useMutation({
    onSuccess: () => {
      utils.emailTemplate.list.invalidate();
    },
  });

  const breadcrumbItems = [{ label: t("emailTemplates.title") }];
  const emailTemplates = data?.emailTemplates ?? [];
  const total = data?.total ?? 0;

  const columns: DataTableColumn<EmailTemplateListItemView>[] = [
    {
      field: "name",
      header: t("emailTemplates.name"),
      sortable: true,
    },
    {
      field: "status",
      header: t("emailTemplates.status"),
      sortable: true,
      body: (template) => (
        <Badge
          value={
            template.status === "ACTIVE"
              ? t("common.active")
              : t("common.draft")
          }
          severity={template.status === "ACTIVE" ? "success" : "secondary"}
        />
      ),
    },
    {
      field: "tags",
      header: t("emailTemplates.tags"),
      body: (template) => (
        <div className="flex flex-wrap gap-2">
          {template.tags.length ? (
            template.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-brand-blue/30 bg-brand-blue/10 px-2.5 py-1 text-xs font-medium text-brand-blue"
              >
                {tag}
              </span>
            ))
          ) : (
            <span className="text-sm text-zinc-500">-</span>
          )}
        </div>
      ),
    },
    {
      field: "createdById",
      header: t("emailTemplates.createdBy"),
      body: (template) => template.createdBy.name,
    },
    {
      field: "updatedAt",
      header: t("emailTemplates.updatedAt"),
      sortable: true,
      body: (template) => new Date(template.updatedAt).toLocaleDateString(),
    },
  ];

  const filters: DataTableFilter[] = [
    {
      field: "status",
      label: t("emailTemplates.status"),
      type: "select",
      options: [
        { label: t("common.draft"), value: "DRAFT" },
        { label: t("common.active"), value: "ACTIVE" },
      ],
    },
  ];

  const actions: DataTableAction<EmailTemplateListItemView>[] = [
    {
      label: t("emailTemplates.openEditor"),
      icon: "pi pi-pencil",
      onClick: (template) => router.push(`/email-templates/${template.id}`),
    },
    {
      label: t("emailTemplates.delete"),
      icon: "pi pi-trash",
      severity: "danger",
      onClick: (template) => {
        confirmDialog({
          message: t("emailTemplates.deleteConfirm", { name: template.name }),
          header: t("emailTemplates.deleteTitle"),
          icon: "pi pi-exclamation-triangle",
          accept: () => deleteMutation.mutate({ id: template.id }),
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
            {t("emailTemplates.title")}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            {t("emailTemplates.subtitle")}
          </p>
        </div>

        <Button
          type="button"
          size="small"
          label={t("emailTemplates.newTemplate")}
          icon="pi pi-plus"
          onClick={() => router.push("/email-templates/new")}
          className="rounded-xl border-0 bg-(image:--brand-gradient) px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(41,184,255,0.25)]"
        />
      </div>

      <AppDataTable
        data={emailTemplates}
        total={total}
        columns={columns}
        dataKey="id"
        loading={isLoading}
        searchPlaceholder={t("emailTemplates.searchTemplates")}
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
