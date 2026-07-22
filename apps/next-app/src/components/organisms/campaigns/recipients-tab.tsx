"use client";

import { useMemo, useState } from "react";
import { Badge } from "primereact/badge";
import { Column } from "primereact/column";
import { DataTable, type DataTablePageEvent } from "primereact/datatable";
import { Timeline } from "primereact/timeline";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/src/server/trpc/router";
import { trpc } from "@/src/lib/trpc";

type Recipient =
  inferRouterOutputs<AppRouter>["campaign"]["listRecipients"]["rows"][number];
type TimelineEvent = {
  id: string;
  source: "Campaign" | "Delivery";
  type: string;
  occurredAt: Date | string;
  metadata?: unknown;
};

const eventColors: Record<string, string> = {
  SCHEDULED: "#3B82F6",
  QUEUED: "#64748B",
  DISPATCH_STARTED: "#2563EB",
  ACCEPTED: "#06B6D4",
  SENT: "#14B8A6",
  DELIVERED: "#22C55E",
  DEFERRED: "#EAB308",
  RETRY_SCHEDULED: "#F97316",
  DELIVERY_UNKNOWN: "#F59E0B",
  OPENED: "#8B5CF6",
  CLICKED: "#0EA5E9",
  SUBMITTED: "#F97316",
  REPORTED: "#A855F7",
  BOUNCED: "#EF4444",
  REJECTED: "#E11D48",
  FAILED: "#DC2626",
  CANCELLED: "#71717A",
};

const dateFormatters = new Map<string, Intl.DateTimeFormat>();
function formatDate(value: Date | string, timeZone: string): string {
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

function formatLabel(value: string): string {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function deliverySeverity(status: string) {
  if (status === "SENT") return "success" as const;
  if (["FAILED", "DELIVERY_UNKNOWN"].includes(status)) return "danger" as const;
  if (["QUEUED", "DISPATCHING", "RETRYABLE"].includes(status))
    return "warning" as const;
  return "secondary" as const;
}

function metadataEntries(metadata: unknown): Array<[string, string]> {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata))
    return [];
  return Object.entries(metadata).map(([key, value]) => [
    formatLabel(key),
    value === null ? "—" : String(value),
  ]);
}

function RecipientTimeline({
  campaignId,
  recipientId,
  timeZone,
}: {
  campaignId: string;
  recipientId: string;
  timeZone: string;
}) {
  const input = {
    campaignId,
    campaignRecipientId: recipientId,
    limit: 200,
    offset: 0,
  };
  const campaignEvents = trpc.campaign.listCampaignEvents.useQuery(input);
  const deliveryEvents = trpc.campaign.listDeliveryEvents.useQuery(input);
  const events = useMemo<TimelineEvent[]>(
    () =>
      [
        ...(campaignEvents.data ?? []).map((event) => ({
          ...event,
          source: "Campaign" as const,
        })),
        ...(deliveryEvents.data ?? []).map((event) => ({
          ...event,
          source: "Delivery" as const,
        })),
      ].sort(
        (left, right) =>
          new Date(left.occurredAt).getTime() -
          new Date(right.occurredAt).getTime(),
      ),
    [campaignEvents.data, deliveryEvents.data],
  );

  if (campaignEvents.isLoading || deliveryEvents.isLoading)
    return <p className="p-4 text-sm text-zinc-400">Loading event history…</p>;
  if (!events.length)
    return <p className="p-4 text-sm text-zinc-500">No events recorded.</p>;

  return (
    <div className="rounded-xl border border-white/10 bg-brand-navy/30 p-5">
      <h3 className="text-sm font-semibold text-white">Recipient timeline</h3>
      <p className="mt-1 text-xs text-zinc-500">
        Delivery and campaign engagement events in chronological order.
      </p>
      <Timeline
        value={events}
        className="mt-5"
        opposite={(event: TimelineEvent) => (
          <time className="text-xs text-zinc-500">
            {formatDate(event.occurredAt, timeZone)}
          </time>
        )}
        marker={(event: TimelineEvent) => (
          <span
            className="flex h-3.5 w-3.5 rounded-full ring-4 ring-brand-dark"
            style={{ backgroundColor: eventColors[event.type] ?? "#64748B" }}
            aria-hidden="true"
          />
        )}
        content={(event: TimelineEvent) => {
          const metadata = metadataEntries(event.metadata);
          return (
            <div className="pb-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-white">
                  {formatLabel(event.type)}
                </span>
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-zinc-400">
                  {event.source}
                </span>
              </div>
              {metadata.length ? (
                <dl className="mt-2 grid gap-1 text-xs text-zinc-400 sm:grid-cols-2">
                  {metadata.map(([key, value]) => (
                    <div key={key}>
                      <dt className="inline text-zinc-500">{key}: </dt>
                      <dd className="inline">{value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </div>
          );
        }}
      />
    </div>
  );
}

export function CampaignRecipientsTab({
  campaignId,
  timeZone,
}: {
  campaignId: string;
  timeZone: string;
}) {
  const [page, setPage] = useState({ first: 0, rows: 25 });
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const recipients = trpc.campaign.listRecipients.useQuery({
    campaignId,
    limit: page.rows,
    offset: page.first,
  });

  const onPage = (event: DataTablePageEvent) =>
    setPage({ first: event.first, rows: event.rows });

  return (
    <section
      aria-labelledby="campaign-recipients-heading"
      className="rounded-2xl border border-[#1C2945] bg-brand-dark p-5"
    >
      <div>
        <h2
          id="campaign-recipients-heading"
          className="text-lg font-semibold text-white"
        >
          Campaign recipients
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          Expand a recipient to inspect their delivery and engagement timeline.
        </p>
      </div>

      <DataTable
        value={recipients.data?.rows ?? []}
        dataKey="id"
        className="mt-5"
        loading={recipients.isLoading}
        lazy
        paginator
        first={page.first}
        rows={page.rows}
        totalRecords={recipients.data?.total ?? 0}
        rowsPerPageOptions={[10, 25, 50, 100]}
        onPage={onPage}
        expandedRows={expandedRows}
        onRowToggle={(event) =>
          setExpandedRows(event.data as Record<string, boolean>)
        }
        rowExpansionTemplate={(recipient: Recipient) => (
          <RecipientTimeline
            campaignId={campaignId}
            recipientId={recipient.id}
            timeZone={timeZone}
          />
        )}
        emptyMessage="No recipients have been materialized."
        tableStyle={{ minWidth: "68rem" }}
      >
        <Column expander style={{ width: "3rem" }} />
        <Column
          header="Recipient"
          body={(recipient: Recipient) => (
            <div>
              <p className="font-medium text-white">
                {recipient.firstName} {recipient.lastName}
              </p>
              <p className="text-xs text-zinc-500">{recipient.email}</p>
            </div>
          )}
        />
        <Column field="position" header="Position" />
        <Column
          field="scheduledAt"
          header="Scheduled"
          body={(recipient: Recipient) =>
            formatDate(recipient.scheduledAt, timeZone)
          }
        />
        <Column
          field="deliveryStatus"
          header="Delivery"
          body={(recipient: Recipient) => (
            <Badge
              value={formatLabel(recipient.deliveryStatus)}
              severity={deliverySeverity(recipient.deliveryStatus)}
            />
          )}
        />
        <Column
          header="Engagement"
          body={(recipient: Recipient) => (
            <span className="text-sm text-zinc-300">
              {formatLabel(recipient.highestNegativeEvent)}
            </span>
          )}
        />
        <Column
          field="reported"
          header="Reported"
          body={(recipient: Recipient) =>
            recipient.reported ? (
              <i
                className="pi pi-check-circle text-violet-400"
                aria-label="Reported"
              />
            ) : (
              <span className="text-zinc-600">—</span>
            )
          }
        />
        <Column field="attemptCount" header="Attempts" />
      </DataTable>
    </section>
  );
}
