"use client";

import { Chart } from "primereact/chart";
import { Skeleton } from "primereact/skeleton";
import type { OrganizationAnalyticsMonth } from "@next-phish/backend";
import { useTranslation } from "@/src/lib/i18n";

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
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

interface CampaignsChartProps {
  months: OrganizationAnalyticsMonth[];
  loading?: boolean;
}

export function CampaignsChart({ months, loading }: CampaignsChartProps) {
  const t = useTranslation();
  const labels = months.map((item) => {
    const monthIndex = Number(item.month.slice(5, 7)) - 1;
    return t(monthKeys[monthIndex] ?? "charts.jan");
  });
  const data = {
    labels,
    datasets: [
      {
        label: t("charts.campaigns"),
        data: months.map((item) => item.campaigns),
        backgroundColor: "rgba(41, 184, 255, 0.8)",
        borderColor: "#29b8ff",
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  return (
    <div className="rounded-xl border border-white/10 bg-brand-dark p-5">
      <h3 className="mb-4 text-sm font-semibold text-zinc-200">
        {t("charts.campaignsLast6Months")}
      </h3>
      <div className="h-[250px]">
        {loading ? (
          <Skeleton width="100%" height="250px" borderRadius="0.75rem" />
        ) : (
          <Chart type="bar" data={data} options={options} />
        )}
      </div>
    </div>
  );
}
