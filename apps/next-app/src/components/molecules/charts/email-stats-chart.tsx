"use client";

import { Chart } from "primereact/chart";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

const datasets = [
  {
    label: "Sent",
    data: [1200, 1900, 1500, 2100, 1800, 2400],
    borderColor: "#29b8ff",
    backgroundColor: "rgba(41, 184, 255, 0.1)",
    tension: 0.3,
  },
  {
    label: "Opened",
    data: [800, 1200, 1000, 1500, 1200, 1800],
    borderColor: "#15e5d4",
    backgroundColor: "rgba(21, 229, 212, 0.1)",
    tension: 0.3,
  },
  {
    label: "Clicked",
    data: [400, 600, 500, 800, 600, 900],
    borderColor: "#5c73ff",
    backgroundColor: "rgba(92, 115, 255, 0.1)",
    tension: 0.3,
  },
  {
    label: "Submitted",
    data: [50, 80, 60, 100, 70, 120],
    borderColor: "#7b5cff",
    backgroundColor: "rgba(123, 92, 255, 0.1)",
    tension: 0.3,
  },
  {
    label: "Reported",
    data: [20, 30, 25, 40, 35, 50],
    borderColor: "#f59e0b",
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    tension: 0.3,
  },
  {
    label: "Errored",
    data: [5, 10, 8, 12, 7, 15],
    borderColor: "#ef4444",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    tension: 0.3,
  },
];

const data = { labels: months, datasets };

const options = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: "index" as const,
    intersect: false,
  },
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
      },
      grid: { color: "rgba(255,255,255,0.06)" },
      border: { display: false },
    },
  },
};

export function EmailStatsChart() {
  return (
    <div className="rounded-xl border border-white/10 bg-brand-dark p-5">
      <h3 className="mb-4 text-sm font-semibold text-zinc-200">
        Email Stats (Last 6 months)
      </h3>
      <div className="h-[250px]">
        <Chart type="line" data={data} options={options} />
      </div>
    </div>
  );
}
