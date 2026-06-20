"use client";

import { Chart } from "primereact/chart";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

const data = {
  labels: months,
  datasets: [
    {
      label: "Campaigns",
      data: [3, 7, 4, 8, 5, 12],
      backgroundColor: "rgba(41, 184, 255, 0.8)",
      borderColor: "#29b8ff",
      borderWidth: 1,
      borderRadius: 6,
    },
  ],
};

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
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
        stepSize: 2,
      },
      grid: { color: "rgba(255,255,255,0.06)" },
      border: { display: false },
    },
  },
};

export function CampaignsChart() {
  return (
    <div className="rounded-xl border border-white/10 bg-brand-dark p-5">
      <h3 className="mb-4 text-sm font-semibold text-zinc-200">
        Campaigns (Last 6 months)
      </h3>
      <div className="h-[250px]">
        <Chart type="bar" data={data} options={options} />
      </div>
    </div>
  );
}
