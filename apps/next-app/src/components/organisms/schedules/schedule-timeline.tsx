"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Chart } from "primereact/chart";
import type { ChartData, ChartOptions, TooltipItem } from "chart.js";
import { Skeleton } from "primereact/skeleton";
import { trpc } from "@/src/lib/trpc";

const DAY_MS = 86_400_000;

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function endFromDays(start: Date, days: number | null): Date {
  return new Date(start.getTime() + (days ?? 20) * DAY_MS);
}

type TimelineRow = {
  id: string;
  kind: "schedule" | "campaign";
  label: string;
  status: string;
  start: Date;
  end: Date;
};

export function ScheduleTimeline() {
  const router = useRouter();
  const range = useMemo(() => {
    const startsAt = new Date();
    startsAt.setHours(0, 0, 0, 0);
    return { startsAt, endsAt: addMonths(startsAt, 3) };
  }, []);
  const { data, isLoading } = trpc.campaign.getScheduleTimeline.useQuery(range);

  const rows = useMemo<TimelineRow[]>(() => {
    if (!data) return [];
    const schedules = data.schedules.map((schedule) => {
      const start = new Date(
        Math.max(
          new Date(schedule.startsAt).getTime(),
          range.startsAt.getTime(),
        ),
      );
      const naturalEnd = schedule.endsAt
        ? new Date(schedule.endsAt)
        : schedule.type === "ONE_TIME"
          ? endFromDays(
              new Date(schedule.startsAt),
              schedule.autoCompleteAfterDays,
            )
          : range.endsAt;
      return {
        id: schedule.id,
        kind: "schedule" as const,
        label: schedule.name,
        status: schedule.status,
        start,
        end: new Date(Math.min(naturalEnd.getTime(), range.endsAt.getTime())),
      };
    });
    const campaigns = data.campaigns.map((campaign) => {
      const occurrence = new Date(campaign.occurrenceAt ?? campaign.createdAt);
      return {
        id: campaign.id,
        kind: "campaign" as const,
        label: campaign.name,
        status: campaign.status,
        start: new Date(
          Math.max(occurrence.getTime(), range.startsAt.getTime()),
        ),
        end: new Date(
          Math.min(
            endFromDays(occurrence, campaign.autoCompleteAfterDays).getTime(),
            range.endsAt.getTime(),
          ),
        ),
      };
    });
    return [...schedules, ...campaigns]
      .filter((row) => row.end > row.start)
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [data, range]);

  const chartData = useMemo<ChartData<"bar", [number, number][], string>>(
    () => ({
      labels: rows.map((row) => row.label),
      datasets: [
        {
          label: "Timeline",
          data: rows.map((row) => [row.start.getTime(), row.end.getTime()]),
          backgroundColor: rows.map((row) =>
            row.kind === "schedule"
              ? "rgba(41, 184, 255, 0.78)"
              : "rgba(21, 229, 212, 0.78)",
          ),
          borderColor: rows.map((row) =>
            row.kind === "schedule" ? "#29B8FF" : "#15E5D4",
          ),
          borderWidth: 1,
          borderRadius: 6,
          borderSkipped: false,
          barThickness: 18,
        },
      ],
    }),
    [rows],
  );

  const options = useMemo<ChartOptions<"bar">>(
    () => ({
      indexAxis: "y",
      maintainAspectRatio: false,
      animation: false,
      onClick: (_event, elements) => {
        const row = rows[elements[0]?.index ?? -1];
        if (row)
          router.push(
            row.kind === "schedule"
              ? `/schedule/${row.id}`
              : `/campaigns/${row.id}`,
          );
      },
      interaction: { intersect: false, mode: "nearest" },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context: TooltipItem<"bar">) => {
              const row = rows[context.dataIndex];
              if (!row) return "";
              const date = new Intl.DateTimeFormat(undefined, {
                dateStyle: "medium",
              });
              return `${row.kind === "schedule" ? "Schedule" : "Campaign"} · ${row.status} · ${date.format(row.start)} – ${date.format(row.end)}`;
            },
          },
        },
      },
      scales: {
        x: {
          type: "linear",
          min: range.startsAt.getTime(),
          max: range.endsAt.getTime(),
          grid: { color: "rgba(255, 255, 255, 0.08)" },
          border: { color: "rgba(255, 255, 255, 0.12)" },
          ticks: {
            color: "#a1a1aa",
            maxTicksLimit: 7,
            callback: (value) =>
              new Intl.DateTimeFormat(undefined, {
                month: "short",
                day: "numeric",
              }).format(new Date(Number(value))),
          },
        },
        y: {
          grid: { display: false },
          border: { display: false },
          ticks: { color: "#d4d4d8" },
        },
      },
    }),
    [range, router, rows],
  );

  return (
    <section
      aria-labelledby="schedule-timeline-heading"
      className="rounded-xl border border-white/10 bg-brand-dark p-5"
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2
            id="schedule-timeline-heading"
            className="text-lg font-semibold text-white"
          >
            Three-month timeline
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Upcoming schedules and running campaigns. Select a bar to open it.
          </p>
        </div>
        <div
          className="flex gap-4 text-xs text-zinc-300"
          aria-label="Timeline legend"
        >
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-brand-blue" />
            Schedules
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-brand-cyan" />
            Campaigns
          </span>
        </div>
      </div>
      {isLoading ? (
        <Skeleton height="18rem" borderRadius="0.75rem" />
      ) : rows.length ? (
        <div style={{ height: `${Math.max(280, rows.length * 42 + 64)}px` }}>
          <Chart type="bar" data={chartData} options={options} />
        </div>
      ) : (
        <div className="flex min-h-52 items-center justify-center rounded-lg border border-dashed border-white/10 text-sm text-zinc-400">
          No schedules or running campaigns in the next three months.
        </div>
      )}
    </section>
  );
}
