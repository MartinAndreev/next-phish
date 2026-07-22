"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BreadCrumb } from "primereact/breadcrumb";
import { Button } from "primereact/button";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Tag } from "primereact/tag";
import type { inferRouterOutputs } from "@trpc/server";
import { FormMessage } from "@/src/components/atoms/form-message";
import type { AppRouter } from "@/src/server/trpc/router";
import { trpc } from "@/src/lib/trpc";

const dateFormatters = new Map<string, Intl.DateTimeFormat>();

function formatDate(value: Date | string | null, timeZone: string): string {
  if (!value) return "Not set";
  let formatter = dateFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone,
    });
    dateFormatters.set(timeZone, formatter);
  }
  return formatter.format(new Date(value));
}

function formatEnum(value: string): string {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function statusSeverity(status: string) {
  if (status === "CANCELLED" || status === "BROKEN") return "danger" as const;
  if (status === "COMPLETED") return "success" as const;
  if (status === "RUNNING") return "warning" as const;
  return "info" as const;
}

function DetailItem({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-white">{value}</dd>
      {helper ? <p className="mt-1 text-xs text-zinc-500">{helper}</p> : null}
    </div>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#1C2945] bg-brand-dark p-5">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-zinc-400">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function deliverySummary(data: {
  deliveryMode: string;
  dripEmailsPerMinute: number | null;
  batchSize: number | null;
  batchIntervalMinutes: number | null;
}) {
  if (data.deliveryMode === "DRIP")
    return `${data.dripEmailsPerMinute ?? "—"} emails per minute`;
  if (data.deliveryMode === "BATCH")
    return `${data.batchSize ?? "—"} recipients every ${data.batchIntervalMinutes ?? "—"} minutes`;
  return "All recipients are released together";
}

function recurrenceSummary(data: {
  type: string;
  frequency: string | null;
  weekday: number | null;
  dayOfMonth: number | null;
  month: number | null;
  localTimeMinutes: number | null;
}) {
  if (data.type === "ONE_TIME") return "Runs once at the configured start";
  const parts = [data.frequency ? formatEnum(data.frequency) : "Repeating"];
  if (data.weekday !== null) parts.push(`weekday ${data.weekday}`);
  if (data.dayOfMonth !== null) parts.push(`day ${data.dayOfMonth}`);
  if (data.month !== null) parts.push(`month ${data.month}`);
  if (data.localTimeMinutes !== null) {
    const hours = Math.floor(data.localTimeMinutes / 60)
      .toString()
      .padStart(2, "0");
    const minutes = (data.localTimeMinutes % 60).toString().padStart(2, "0");
    parts.push(`${hours}:${minutes}`);
  }
  return parts.join(" · ");
}

type ScheduleDetail = NonNullable<
  inferRouterOutputs<AppRouter>["campaign"]["getSchedule"]
>;

function ScheduleDetailContent({
  data,
  onNavigate,
}: {
  data: ScheduleDetail;
  onNavigate: (path: string) => void;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
      <div className="space-y-6">
        <Panel
          title="Schedule overview"
          description="The next occurrence and delivery configuration."
        >
          <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <DetailItem
              label="First occurrence"
              value={formatDate(data.startsAt, data.targetTimezone)}
            />
            <DetailItem
              label="Next occurrence"
              value={formatDate(data.nextOccurrenceAt, data.targetTimezone)}
            />
            <DetailItem label="Timezone" value={data.targetTimezone} />
            <DetailItem
              label="Delivery"
              value={formatEnum(data.deliveryMode)}
              helper={deliverySummary(data)}
            />
            <DetailItem
              label="Target group"
              value={data.targetGroup?.name ?? "Inherited from campaign"}
              helper={
                data.targetGroup
                  ? `${data.targetGroup._count?.users ?? 0} recipients`
                  : undefined
              }
            />
            <DetailItem
              label="Auto-complete"
              value={
                data.autoCompleteAfterDays
                  ? `${data.autoCompleteAfterDays} days after start`
                  : "Disabled"
              }
            />
          </dl>
        </Panel>

        <Panel
          title="Campaign sources"
          description="Published campaigns used to create each occurrence."
        >
          <div className="space-y-3">
            {data.sources.map((source, index) => (
              <div
                key={source.campaignId}
                className="flex flex-col gap-3 rounded-xl border border-white/10 bg-[#07142B] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-zinc-500">
                      #{index + 1}
                    </span>
                    <h3 className="font-medium text-white">
                      {source.campaign.name}
                    </h3>
                    <Tag
                      value={formatEnum(source.campaign.type)}
                      severity="secondary"
                      rounded
                    />
                  </div>
                  <p className="mt-1 text-sm text-zinc-400">
                    {formatEnum(source.campaign.status)} · Updated{" "}
                    {formatDate(source.campaign.updatedAt, data.targetTimezone)}
                  </p>
                </div>
                <Button
                  size="small"
                  text
                  label="View campaign"
                  icon="pi pi-arrow-right"
                  iconPos="right"
                  onClick={() => onNavigate(`/campaigns/${source.campaignId}`)}
                />
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="Generated campaigns"
          description="Campaign occurrences materialized from this schedule."
        >
          {data.campaigns.length ? (
            <div className="space-y-3">
              {data.campaigns.map((campaign) => (
                <button
                  key={campaign.id}
                  type="button"
                  onClick={() => onNavigate(`/campaigns/${campaign.id}`)}
                  className="flex w-full flex-col gap-2 rounded-xl border border-white/10 bg-[#07142B] p-4 text-left transition hover:border-brand-blue/60 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-white">{campaign.name}</p>
                    <p className="mt-1 text-sm text-zinc-400">
                      {formatDate(campaign.occurrenceAt, data.targetTimezone)}
                    </p>
                  </div>
                  <Tag
                    value={formatEnum(campaign.status)}
                    severity={statusSeverity(campaign.status)}
                    rounded
                  />
                </button>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-zinc-400">
              No campaigns have been generated yet.
            </p>
          )}
        </Panel>
      </div>

      <div className="space-y-6">
        <Panel title="Recurrence">
          <dl className="space-y-5">
            <DetailItem label="Pattern" value={recurrenceSummary(data)} />
            <DetailItem
              label="Selection strategy"
              value={
                data.selectionStrategy
                  ? formatEnum(data.selectionStrategy)
                  : "Not applicable"
              }
              helper={
                data.selectionStrategy === "DECK"
                  ? data.shuffleDeck
                    ? "Deck is shuffled before selection"
                    : "Uses source order"
                  : undefined
              }
            />
            <DetailItem
              label="Maximum campaigns"
              value={data.maxCampaigns?.toString() ?? "No limit"}
            />
            <DetailItem
              label="Ends"
              value={formatDate(data.endsAt, data.targetTimezone)}
            />
          </dl>
        </Panel>

        <Panel title="Lifecycle and metadata">
          <dl className="space-y-5">
            <DetailItem
              label="Created by"
              value={data.createdBy.name || data.createdBy.email}
              helper={data.createdBy.email}
            />
            <DetailItem
              label="Created"
              value={formatDate(data.createdAt, data.targetTimezone)}
            />
            <DetailItem
              label="Last updated"
              value={formatDate(data.updatedAt, data.targetTimezone)}
            />
            <DetailItem
              label="Completed"
              value={formatDate(data.completedAt, data.targetTimezone)}
            />
            <DetailItem
              label="Cancelled"
              value={formatDate(data.cancelledAt, data.targetTimezone)}
            />
            <DetailItem label="Schedule ID" value={data.id} />
          </dl>
        </Panel>
      </div>
    </div>
  );
}

export function ScheduleDetailContainer({
  id,
  saved,
}: {
  id: string;
  saved?: string;
}) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const { data, isLoading } = trpc.campaign.getSchedule.useQuery({ id });
  const cancel = trpc.campaign.cancelSchedule.useMutation({
    onSuccess: async () => {
      await utils.campaign.getSchedule.invalidate({ id });
      setActionError("");
      setActionMessage("Schedule cancelled successfully.");
    },
    onError: (error) => setActionError(error.message),
  });
  const duplicate = trpc.campaign.duplicateSchedule.useMutation({
    onSuccess: (result) =>
      router.push(`/schedule/${result.schedule.id}?saved=duplicated`),
    onError: (error) => setActionError(error.message),
  });
  const activate = trpc.campaign.activateSchedule.useMutation({
    onSuccess: async () => {
      await utils.campaign.getSchedule.invalidate({ id });
      setActionError("");
      setActionMessage("Schedule activated successfully.");
    },
    onError: (error) => setActionError(error.message),
  });
  const deleteSchedule = trpc.campaign.deleteSchedule.useMutation({
    onSuccess: async () => {
      await utils.campaign.listSchedules.invalidate();
      router.push("/schedule");
    },
    onError: (error) => setActionError(error.message),
  });

  if (isLoading) return <p className="p-8 text-zinc-400">Loading schedule…</p>;
  if (!data) return <p className="p-8 text-zinc-400">Schedule not found.</p>;

  const canEdit = !["COMPLETED", "CANCELLED"].includes(data.status);
  const savedMessage =
    saved === "created"
      ? "Schedule created successfully."
      : saved === "updated"
        ? "Schedule updated successfully."
        : saved === "duplicated"
          ? "Schedule duplicated successfully."
          : "";

  return (
    <div className="space-y-6 px-6 py-8">
      <div>
        <BreadCrumb
          home={{ icon: "pi pi-home", url: "/" }}
          model={[
            { label: "Schedule", url: "/schedule" },
            { label: data.name },
          ]}
        />
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Tag
                value={formatEnum(data.status)}
                severity={statusSeverity(data.status)}
                rounded
              />
              <Tag value={formatEnum(data.type)} severity="secondary" rounded />
            </div>
            <h1 className="text-2xl font-semibold text-white">{data.name}</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Schedule timing, audience, source templates, and generated
              campaigns.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canEdit ? (
              <Button
                size="small"
                label="Edit schedule"
                icon="pi pi-pencil"
                onClick={() => router.push(`/schedule/${id}/edit`)}
              />
            ) : null}
            {data.status === "DRAFT" ? (
              <Button
                size="small"
                label="Activate"
                icon="pi pi-play"
                loading={activate.isPending}
                onClick={() => activate.mutate({ id })}
              />
            ) : null}
            <Button
              size="small"
              outlined
              label="Duplicate"
              icon="pi pi-copy"
              loading={duplicate.isPending}
              onClick={() => duplicate.mutate({ id })}
            />
            {canEdit ? (
              <Button
                size="small"
                outlined
                severity="danger"
                label="Cancel"
                icon="pi pi-times"
                loading={cancel.isPending}
                onClick={() => cancel.mutate({ id })}
              />
            ) : null}
            <Button
              size="small"
              outlined
              severity="danger"
              label="Delete"
              icon="pi pi-trash"
              loading={deleteSchedule.isPending}
              onClick={() =>
                confirmDialog({
                  header: "Delete schedule",
                  message:
                    "Deleting this schedule stops all future executions, completes its active campaigns, and cancels all unsent recipients. Generated campaigns remain available in the Campaigns list. This cannot be undone.",
                  icon: "pi pi-exclamation-triangle",
                  accept: () => deleteSchedule.mutate({ id }),
                })
              }
            />
            <Button
              size="small"
              text
              label="Back"
              icon="pi pi-arrow-left"
              onClick={() => router.push("/schedule")}
            />
          </div>
        </div>
      </div>

      {savedMessage ? (
        <FormMessage variant="success">{savedMessage}</FormMessage>
      ) : null}
      {actionMessage ? (
        <FormMessage variant="success">{actionMessage}</FormMessage>
      ) : null}
      {actionError ? (
        <FormMessage variant="error">{actionError}</FormMessage>
      ) : null}
      {data.brokenReason ? (
        <FormMessage variant="error">{data.brokenReason}</FormMessage>
      ) : null}

      <ScheduleDetailContent
        data={data}
        onNavigate={(path) => router.push(path)}
      />

      <ConfirmDialog
        className="max-w-md"
        draggable={false}
        dismissableMask={true}
      />
    </div>
  );
}
