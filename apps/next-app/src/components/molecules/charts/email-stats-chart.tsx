"use client";

import { Chart } from "primereact/chart";
import { Skeleton } from "primereact/skeleton";
import type { OrganizationAnalyticsMonth } from "@next-phish/backend";
import { useTranslation } from "@/src/lib/i18n";

const options = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: "index" as const, intersect: false },
  plugins: {
    legend: {
      position: "bottom" as const,
      labels: {
        color: "rgba(255,255,255,0.6)",
        usePointStyle: true,
        pointStyle: "circle",
        padding: 16,
        font: { size: 11 },
      },
    },
  },
  scales: {
    x: {
      ticks: { color: "rgba(255,255,255,0.5)", font: { size: 11 } },
      grid: { color: "rgba(255,255,255,0.06)" },
      border: { color: "rgba(255,255,255,0.1)" },
    },
    y: {
      beginAtZero: true,
      ticks: {
        color: "rgba(255,255,255,0.5)",
        font: { size: 11 },
        precision: 0,
      },
      grid: { color: "rgba(255,255,255,0.06)" },
      border: { display: false },
    },
  },
};

const monthKeys = [
  "charts.jan",
  "charts.feb",
  "charts.mar",
  "charts.apr",
  "charts.may",
  "charts.jun",
  "charts.jul",
  "charts.aug",
  "charts.sep",
  "charts.oct",
  "charts.nov",
  "charts.dec",
] as const;

const series = [
  ["sent", "charts.sent", "#29b8ff", "rgba(41, 184, 255, 0.1)"],
  ["opened", "charts.opened", "#15e5d4", "rgba(21, 229, 212, 0.1)"],
  ["clicked", "charts.clicked", "#5c73ff", "rgba(92, 115, 255, 0.1)"],
  ["submitted", "charts.submitted", "#7b5cff", "rgba(123, 92, 255, 0.1)"],
  ["reported", "charts.reported", "#f59e0b", "rgba(245, 158, 11, 0.1)"],
  ["failed", "charts.errored", "#ef4444", "rgba(239, 68, 68, 0.1)"],
] as const;

interface EmailStatsChartProps {
  months: OrganizationAnalyticsMonth[];
  loading?: boolean;
}

export function EmailStatsChart({ months, loading }: EmailStatsChartProps) {
  const t = useTranslation();
  const labels = months.map((item) => {
    const monthIndex = Number(item.month.slice(5, 7)) - 1;
    return t(monthKeys[monthIndex] ?? "charts.jan");
  });
  const data = {
    labels,
    datasets: series.map(([field, label, borderColor, backgroundColor]) => ({
      label: t(label),
      data: months.map((item) => item[field]),
      borderColor,
      backgroundColor,
      tension: 0.3,
    })),
  };

  return (
    <div className="rounded-xl border border-white/10 bg-brand-dark p-5">
      <h3 className="mb-4 text-sm font-semibold text-zinc-200">
        {t("charts.emailStatsLast6Months")}
      </h3>
      <div className="h-[250px]">
        {loading ? (
          <Skeleton width="100%" height="250px" borderRadius="0.75rem" />
        ) : (
          <Chart type="line" data={data} options={options} />
        )}
      </div>
    </div>
  );
}
