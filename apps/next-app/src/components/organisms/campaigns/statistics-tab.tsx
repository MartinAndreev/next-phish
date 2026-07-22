"use client";

import { Chart } from "primereact/chart";
import { Skeleton } from "primereact/skeleton";
import { trpc } from "@/src/lib/trpc";

const deliveryColors: Record<string, string> = {
  PLANNED: "#64748B",
  QUEUED: "#29B8FF",
  DISPATCHING: "#8B5CF6",
  RETRYABLE: "#F59E0B",
  SENT: "#15E5D4",
  FAILED: "#EF4444",
  DELIVERY_UNKNOWN: "#F97316",
  CANCELLED: "#71717A",
};
const chartOptions = {
  maintainAspectRatio: false,
  cutout: "62%",
  plugins: {
    legend: {
      position: "bottom" as const,
      labels: { color: "#D4D4D8", usePointStyle: true, padding: 20 },
    },
  },
};

function formatLabel(value: string): string {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function MetricCard({
  label,
  value,
  total,
  description,
  color,
}: {
  label: string;
  value: number;
  total: number;
  description: string;
  color: string;
}) {
  const percentage = total ? Math.round((value / total) * 100) : 0;
  return (
    <article className="rounded-2xl border border-[#1C2945] bg-brand-dark p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
          {label}
        </p>
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
      </div>
      <p className="mt-3 text-3xl font-semibold text-white">
        {value}
        <span className="ml-1 text-base font-normal text-zinc-500">
          / {total}
        </span>
      </p>
      <p className="mt-1 text-sm font-medium text-zinc-300">{percentage}%</p>
      <p className="mt-3 text-xs leading-5 text-zinc-500">{description}</p>
    </article>
  );
}

export function CampaignStatisticsTab({ campaignId }: { campaignId: string }) {
  const summary = trpc.campaign.executionSummary.useQuery({ campaignId });

  if (summary.isLoading)
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {["sent", "opened", "clicked", "submitted", "reported"].map((key) => (
          <Skeleton key={key} height="11rem" borderRadius="1rem" />
        ))}
      </div>
    );

  if (!summary.data)
    return (
      <p className="rounded-2xl border border-white/10 bg-brand-dark p-6 text-sm text-zinc-400">
        Statistics are not available for this campaign.
      </p>
    );

  const deliveryCounts = Object.fromEntries(
    summary.data.delivery.map((item) => [
      item.deliveryStatus,
      item._count._all,
    ]),
  );
  const negativeCounts = Object.fromEntries(
    summary.data.negative.map((item) => [
      item.highestNegativeEvent,
      item._count._all,
    ]),
  );
  const total =
    summary.data.campaign.expectedRecipientCount ??
    Object.values(deliveryCounts).reduce((sum, count) => sum + count, 0);
  const sent = deliveryCounts.SENT ?? 0;
  const opened =
    (negativeCounts.OPENED ?? 0) +
    (negativeCounts.CLICKED ?? 0) +
    (negativeCounts.SUBMITTED ?? 0);
  const clicked =
    (negativeCounts.CLICKED ?? 0) + (negativeCounts.SUBMITTED ?? 0);
  const submitted = negativeCounts.SUBMITTED ?? 0;
  const deliveryEntries = Object.entries(deliveryCounts).filter(
    ([, count]) => count > 0,
  );
  const chartData = {
    labels: deliveryEntries.map(([status]) => formatLabel(status)),
    datasets: [
      {
        data: deliveryEntries.map(([, count]) => count),
        backgroundColor: deliveryEntries.map(
          ([status]) => deliveryColors[status] ?? "#64748B",
        ),
        borderColor: "#0B1426",
        borderWidth: 2,
      },
    ],
  };
  return (
    <div className="space-y-6">
      <section aria-labelledby="engagement-summary-heading">
        <div>
          <h2
            id="engagement-summary-heading"
            className="text-lg font-semibold text-white"
          >
            Engagement summary
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Unique recipients reaching each campaign milestone.
          </p>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            label="Emails sent"
            value={sent}
            total={total}
            description="Recipients accepted by the configured sending provider."
            color="#15E5D4"
          />
          <MetricCard
            label="Opened"
            value={opened}
            total={total}
            description="Recipients who loaded the campaign tracking pixel."
            color="#8B5CF6"
          />
          <MetricCard
            label="Clicked"
            value={clicked}
            total={total}
            description="Recipients who clicked a tracked campaign link."
            color="#29B8FF"
          />
          <MetricCard
            label="Submitted"
            value={submitted}
            total={total}
            description="Recipients who submitted the campaign landing page."
            color="#F59E0B"
          />
          <MetricCard
            label="Reported"
            value={summary.data.reported}
            total={total}
            description="Recipients who reported the simulation as suspicious."
            color="#EF4444"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-[#1C2945] bg-brand-dark p-5">
        <h2 className="text-lg font-semibold text-white">Delivery status</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Current delivery state across all materialized recipients.
        </p>
        {deliveryEntries.length ? (
          <div className="mt-5 h-80">
            <Chart
              type="doughnut"
              data={chartData}
              options={chartOptions}
              className="h-full"
            />
          </div>
        ) : (
          <p className="mt-5 rounded-xl border border-dashed border-white/10 px-5 py-10 text-center text-sm text-zinc-500">
            Delivery data will appear after recipients are materialized.
          </p>
        )}
      </section>
    </div>
  );
}
