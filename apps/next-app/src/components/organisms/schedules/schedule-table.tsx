"use client";

import { useRouter } from "next/navigation";
import { Badge } from "primereact/badge";
import { AppDataTable } from "@/src/components/molecules/data-table";
import type {
  DataTableAction,
  DataTableColumn,
  DataTableFilter,
} from "@/src/components/molecules/data-table";
import { useDataTable } from "@/src/hooks/use-data-table";
import { useLocale } from "@/src/lib/i18n";
import { trpc } from "@/src/lib/trpc";

export type ScheduleRow = {
  id: string;
  name: string;
  type: "ONE_TIME" | "RECURRING";
  status: "DRAFT" | "SCHEDULED" | "RUNNING" | "COMPLETED" | "CANCELLED";
  startsAt: Date;
  targetTimezone: string;
  frequency: string | null;
  targetGroup: { name: string; _count: { users: number } } | null;
  sources: Array<{ campaign: { name: string } }>;
  _count: { campaigns: number };
};

function formatLabel(value: string): string {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function statusSeverity(status: ScheduleRow["status"]) {
  if (status === "RUNNING") return "success" as const;
  if (status === "SCHEDULED") return "info" as const;
  if (status === "CANCELLED") return "danger" as const;
  if (status === "DRAFT") return "warning" as const;
  return "secondary" as const;
}

interface ScheduleTableProps {
  onChanged: () => void;
}

export function ScheduleTable({ onChanged }: ScheduleTableProps) {
  const router = useRouter();
  const locale = useLocale();
  const utils = trpc.useUtils();
  const { setSearch, setSorts, setFilterValues, setPage, buildQueryInput } =
    useDataTable();
  const queryInput = buildQueryInput(["name", "type", "status", "startsAt"]);
  const { data, isLoading } = trpc.campaign.listSchedules.useQuery(queryInput);
  const cancel = trpc.campaign.cancelSchedule.useMutation({
    onSuccess: async () => {
      await utils.campaign.listSchedules.invalidate();
      onChanged();
    },
  });
  const duplicate = trpc.campaign.duplicateSchedule.useMutation({
    onSuccess: async () => {
      await utils.campaign.listSchedules.invalidate();
      onChanged();
    },
  });
  const rows = (data?.rows ?? []) as ScheduleRow[];

  const columns: DataTableColumn<ScheduleRow>[] = [
    {
      field: "name",
      header: "Name",
      sortable: true,
      body: (schedule) => (
        <button
          type="button"
          className="font-medium text-white hover:text-brand-blue"
          onClick={() => router.push(`/schedule/${schedule.id}`)}
        >
          {schedule.name}
        </button>
      ),
    },
    {
      field: "type",
      header: "Type",
      sortable: true,
      body: (schedule) => (
        <Badge
          value={formatLabel(schedule.type)}
          severity={schedule.type === "RECURRING" ? "info" : "secondary"}
        />
      ),
    },
    {
      field: "status",
      header: "Status",
      sortable: true,
      body: (schedule) => (
        <Badge
          value={formatLabel(schedule.status)}
          severity={statusSeverity(schedule.status)}
        />
      ),
    },
    {
      field: "frequency",
      header: "Cadence",
      body: (schedule) =>
        schedule.frequency ? formatLabel(schedule.frequency) : "One time",
    },
    {
      field: "sources",
      header: "Campaign source",
      body: (schedule) => (
        <div className="max-w-64 text-sm">
          <p className="truncate text-zinc-200">
            {schedule.sources.map(({ campaign }) => campaign.name).join(", ")}
          </p>
          <p className="text-xs text-zinc-500">
            {schedule._count.campaigns} generated campaign
            {schedule._count.campaigns === 1 ? "" : "s"}
          </p>
        </div>
      ),
    },
    {
      field: "targetGroup",
      header: "Audience",
      body: (schedule) =>
        schedule.targetGroup ? (
          <div className="text-sm">
            <p className="text-zinc-200">{schedule.targetGroup.name}</p>
            <p className="text-xs text-zinc-500">
              {schedule.targetGroup._count.users} recipients
            </p>
          </div>
        ) : (
          <span className="text-zinc-500">Inherited</span>
        ),
    },
    {
      field: "startsAt",
      header: "Starts",
      sortable: true,
      body: (schedule) =>
        new Date(schedule.startsAt).toLocaleString(locale, {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: schedule.targetTimezone,
        }),
    },
  ];

  const filters: DataTableFilter[] = [
    {
      field: "type",
      label: "Type",
      type: "select",
      options: ["ONE_TIME", "RECURRING"].map((value) => ({
        label: formatLabel(value),
        value,
      })),
    },
    {
      field: "status",
      label: "Status",
      type: "select",
      options: ["DRAFT", "SCHEDULED", "RUNNING", "COMPLETED", "CANCELLED"].map(
        (value) => ({ label: formatLabel(value), value }),
      ),
    },
  ];

  const actions: DataTableAction<ScheduleRow>[] = [
    {
      label: "View details",
      icon: "pi pi-eye",
      onClick: (schedule) => router.push(`/schedule/${schedule.id}`),
    },
    {
      label: "Duplicate",
      icon: "pi pi-copy",
      onClick: (schedule) => duplicate.mutate({ id: schedule.id }),
    },
    {
      label: "Cancel schedule",
      icon: "pi pi-times",
      severity: "danger",
      visible: (schedule) =>
        !["COMPLETED", "CANCELLED"].includes(schedule.status),
      onClick: (schedule) => cancel.mutate({ id: schedule.id }),
    },
  ];

  return (
    <section aria-labelledby="schedule-table-heading">
      <div className="mb-4">
        <h2
          id="schedule-table-heading"
          className="text-lg font-semibold text-white"
        >
          Schedule database
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          Search, filter, and manage all campaign schedules.
        </p>
      </div>
      <AppDataTable
        data={rows}
        total={data?.total ?? 0}
        columns={columns}
        dataKey="id"
        loading={isLoading}
        searchPlaceholder="Search schedules"
        filters={filters}
        actions={actions}
        onSearch={setSearch}
        onSort={setSorts}
        onFilter={setFilterValues}
        onPage={(offset, limit) => setPage({ offset: offset * limit, limit })}
      />
    </section>
  );
}
