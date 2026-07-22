"use client";

import { useRouter } from "next/navigation";
import { Badge } from "primereact/badge";
import { BreadCrumb } from "primereact/breadcrumb";
import { Button } from "primereact/button";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { AppDataTable } from "@/src/components/molecules/data-table";
import type {
  DataTableAction,
  DataTableColumn,
  DataTableFilter,
} from "@/src/components/molecules/data-table";
import { useDataTable } from "@/src/hooks/use-data-table";
import { trpc } from "@/src/lib/trpc";

type CampaignRow = {
  id: string;
  name: string;
  tags: string[];
  type: "TEMPLATE" | "CONCRETE";
  status: string;
  targetTimezone: string;
  updatedAt: Date;
  emailTemplate: { name: string } | null;
  page: { name: string } | null;
  targetGroup: { name: string; _count: { users: number } } | null;
};

function formatLabel(value: string): string {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

const dateFormatters = new Map<string, Intl.DateTimeFormat>();

function formatDate(value: Date, timeZone: string): string {
  let formatter = dateFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeZone,
    });
    dateFormatters.set(timeZone, formatter);
  }
  return formatter.format(new Date(value));
}

function statusSeverity(status: string) {
  if (["PUBLISHED", "ACTIVE"].includes(status)) return "success" as const;
  if (status === "FAILED") return "danger" as const;
  if (["SCHEDULED", "PENDING_START", "PAUSED"].includes(status))
    return "warning" as const;
  return "secondary" as const;
}

export default function CampaignsPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { setSearch, setSorts, setFilterValues, setPage, buildQueryInput } =
    useDataTable();
  const queryInput = buildQueryInput([
    "name",
    "type",
    "status",
    "createdAt",
    "updatedAt",
  ]);
  const { data, isLoading } = trpc.campaign.list.useQuery(queryInput);
  const deleteCampaign = trpc.campaign.delete.useMutation({
    onSuccess: () => utils.campaign.list.invalidate(),
  });
  const rows = (data?.rows ?? []) as CampaignRow[];

  const columns: DataTableColumn<CampaignRow>[] = [
    {
      field: "name",
      header: "Name",
      sortable: true,
      body: (campaign) => (
        <button
          type="button"
          className="cursor-pointer font-medium text-white hover:text-brand-blue"
          onClick={() => router.push(`/campaigns/${campaign.id}`)}
        >
          {campaign.name}
        </button>
      ),
    },
    {
      field: "type",
      header: "Type",
      sortable: true,
      body: (campaign) => (
        <Badge
          value={formatLabel(campaign.type)}
          severity={campaign.type === "CONCRETE" ? "info" : "secondary"}
        />
      ),
    },
    {
      field: "status",
      header: "Status",
      sortable: true,
      body: (campaign) => (
        <Badge
          value={formatLabel(campaign.status)}
          severity={statusSeverity(campaign.status)}
        />
      ),
    },
    {
      field: "tags",
      header: "Tags",
      body: (campaign) => (
        <div className="flex max-w-xs flex-wrap gap-1">
          {campaign.tags.length ? (
            campaign.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-brand-blue/10 px-2 py-0.5 text-xs text-brand-blue"
              >
                #{tag}
              </span>
            ))
          ) : (
            <span className="text-zinc-500">—</span>
          )}
          {campaign.tags.length > 3 ? (
            <span className="text-xs text-zinc-500">
              +{campaign.tags.length - 3}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      field: "emailTemplate",
      header: "Assets",
      body: (campaign) => (
        <div className="max-w-xs text-sm">
          <p className="truncate text-zinc-200">
            {campaign.emailTemplate?.name ?? "Missing email template"}
          </p>
          <p className="truncate text-xs text-zinc-500">
            {campaign.page?.name ?? "Missing landing page"}
          </p>
        </div>
      ),
    },
    {
      field: "targetGroup",
      header: "Audience",
      body: (campaign) =>
        campaign.targetGroup ? (
          <div className="text-sm">
            <p className="text-zinc-200">{campaign.targetGroup.name}</p>
            <p className="text-xs text-zinc-500">
              {campaign.targetGroup._count.users} recipients
            </p>
          </div>
        ) : (
          <span className="text-sm text-zinc-500">Template audience</span>
        ),
    },
    {
      field: "updatedAt",
      header: "Updated",
      sortable: true,
      body: (campaign) =>
        formatDate(campaign.updatedAt, campaign.targetTimezone),
    },
  ];

  const filters: DataTableFilter[] = [
    {
      field: "type",
      label: "Type",
      type: "select",
      options: [
        { label: "Campaign template", value: "TEMPLATE" },
        { label: "Concrete campaign", value: "CONCRETE" },
      ],
    },
    {
      field: "status",
      label: "Status",
      type: "select",
      options: [
        "DRAFT",
        "PUBLISHED",
        "SCHEDULED",
        "PENDING_START",
        "ACTIVE",
        "PAUSED",
        "COMPLETED",
        "FAILED",
      ].map((value) => ({ label: formatLabel(value), value })),
    },
  ];

  const actions: DataTableAction<CampaignRow>[] = [
    {
      label: "View details",
      icon: "pi pi-eye",
      onClick: (campaign) => router.push(`/campaigns/${campaign.id}`),
    },
    {
      label: "Edit campaign",
      icon: "pi pi-pencil",
      visible: (campaign) =>
        campaign.status === "DRAFT" || campaign.status === "PUBLISHED",
      onClick: (campaign) => router.push(`/campaigns/${campaign.id}/edit`),
    },
    {
      label: "Delete campaign",
      icon: "pi pi-trash",
      severity: "danger",
      visible: (campaign) =>
        ["DRAFT", "PUBLISHED", "COMPLETED", "FAILED"].includes(campaign.status),
      onClick: (campaign) =>
        confirmDialog({
          header: "Delete campaign",
          message: `Delete “${campaign.name}” and its execution data? This cannot be undone.`,
          icon: "pi pi-exclamation-triangle",
          accept: () => deleteCampaign.mutate({ id: campaign.id }),
        }),
    },
  ];

  return (
    <div className="px-6 py-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <BreadCrumb
            home={{ icon: "pi pi-home", url: "/" }}
            model={[{ label: "Campaigns" }]}
          />
          <h1 className="mt-2 text-2xl font-semibold text-white">Campaigns</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Reusable templates and concrete phishing simulations.
          </p>
        </div>
        <Button
          type="button"
          size="small"
          label="New campaign"
          icon="pi pi-plus"
          onClick={() => router.push("/campaigns/new")}
        />
      </div>

      <AppDataTable
        data={rows}
        total={data?.total ?? 0}
        columns={columns}
        dataKey="id"
        loading={isLoading}
        searchPlaceholder="Search campaigns"
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
