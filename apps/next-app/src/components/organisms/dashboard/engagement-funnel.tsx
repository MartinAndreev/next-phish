"use client";

import type { OrganizationDashboardView } from "@next-phish/backend";
import { useTranslation } from "@/src/lib/i18n";

interface EngagementFunnelProps {
  funnel: OrganizationDashboardView["funnel"];
}

export function EngagementFunnel({ funnel }: EngagementFunnelProps) {
  const t = useTranslation();
  const steps = [
    ["scheduled", t("dashboard.scheduled"), "#64748B"],
    ["sent", t("charts.sent"), "#29B8FF"],
    ["opened", t("charts.opened"), "#15E5D4"],
    ["clicked", t("charts.clicked"), "#5C73FF"],
    ["submitted", t("charts.submitted"), "#7B5CFF"],
    ["reported", t("charts.reported"), "#F59E0B"],
  ] as const;
  const maximum = Math.max(funnel.scheduled, 1);

  return (
    <section className="rounded-2xl border border-[#1C2945] bg-brand-dark p-5 shadow-lg">
      <h2 className="text-lg font-semibold text-white">
        {t("dashboard.engagementFunnel")}
      </h2>
      <p className="mt-1 text-sm text-zinc-400">
        {t("dashboard.engagementFunnelHint")}
      </p>
      <div className="mt-6 space-y-4">
        {steps.map(([field, label, color]) => {
          const value = funnel[field];
          const percentage = Math.round((value / maximum) * 100);
          return (
            <div key={field}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium text-zinc-300">{label}</span>
                <span className="text-zinc-400">
                  {value} · {percentage}%
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full min-w-0 rounded-full"
                  style={{
                    width: `${Math.min(percentage, 100)}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
