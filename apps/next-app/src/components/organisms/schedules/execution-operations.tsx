"use client";

import { Skeleton } from "primereact/skeleton";
import { trpc } from "@/src/lib/trpc";

function formatLag(milliseconds: number): string {
  if (milliseconds < 1_000) return "Current";
  const minutes = Math.floor(milliseconds / 60_000);
  if (minutes < 1) return `${Math.floor(milliseconds / 1_000)}s`;
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export function ExecutionOperations() {
  const operations = trpc.campaign.executionOperations.useQuery(undefined, {
    refetchInterval: 10_000,
  });

  if (operations.isLoading)
    return (
      <section
        aria-label="Delivery operations"
        className="grid gap-4 md:grid-cols-4"
      >
        {["due", "outbox", "unknown", "failed"].map((key) => (
          <Skeleton key={key} height="6.5rem" borderRadius="1rem" />
        ))}
      </section>
    );

  if (!operations.data) return null;
  const cards = [
    {
      label: "Due schedules",
      value: String(operations.data.dueSchedules),
      detail: `Lag ${formatLag(operations.data.scheduleLagMs)}`,
      alert: operations.data.scheduleLagMs > 60_000,
    },
    {
      label: "Pending publications",
      value: String(operations.data.pendingOutbox),
      detail: `Oldest ${formatLag(operations.data.outboxLagMs)}`,
      alert: operations.data.outboxLagMs > 60_000,
    },
    {
      label: "Unknown outcomes",
      value: String(operations.data.deliveryUnknown),
      detail: "Requires reconciliation",
      alert: operations.data.deliveryUnknown > 0,
    },
    {
      label: "Failed recipients",
      value: String(operations.data.failedRecipients),
      detail: "Permanent or exhausted",
      alert: operations.data.failedRecipients > 0,
    },
  ];

  return (
    <section
      aria-label="Delivery operations"
      className="grid gap-4 md:grid-cols-4"
    >
      {cards.map((card) => (
        <article
          key={card.label}
          className="rounded-2xl border border-[#1C2945] bg-brand-dark p-5"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            {card.label}
          </p>
          <p
            className={`mt-2 text-3xl font-semibold ${
              card.alert ? "text-amber-300" : "text-white"
            }`}
          >
            {card.value}
          </p>
          <p className="mt-1 text-xs text-zinc-500">{card.detail}</p>
        </article>
      ))}
    </section>
  );
}
