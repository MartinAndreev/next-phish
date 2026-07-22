"use client";

import Link from "next/link";
import type { OrganizationDashboardView } from "@next-phish/backend";
import { useTranslation } from "@/src/lib/i18n";

interface AttentionPanelProps {
  attention: OrganizationDashboardView["attention"];
}

export function AttentionPanel({ attention }: AttentionPanelProps) {
  const t = useTranslation();
  const items = [
    ...(attention.deliveryDisabled
      ? [
          {
            key: "delivery",
            icon: "pi pi-pause-circle",
            title: t("dashboard.deliveryDisabled"),
            detail: t("dashboard.deliveryDisabledHint"),
            href: "/organizations",
          },
        ]
      : []),
    ...(attention.brokenCampaigns
      ? [
          {
            key: "broken",
            icon: "pi pi-exclamation-triangle",
            title: t("dashboard.brokenCampaigns", {
              count: attention.brokenCampaigns,
            }),
            detail: t("dashboard.brokenCampaignsHint"),
            href: "/campaigns",
          },
        ]
      : []),
    ...(attention.failedDeliveries
      ? [
          {
            key: "failed",
            icon: "pi pi-envelope",
            title: t("dashboard.failedDeliveries", {
              count: attention.failedDeliveries,
            }),
            detail: t("dashboard.failedDeliveriesHint"),
            href: "/campaigns",
          },
        ]
      : []),
  ];

  return (
    <section className="rounded-2xl border border-[#1C2945] bg-brand-dark p-5 shadow-lg">
      <h2 className="text-lg font-semibold text-white">
        {t("dashboard.requiresAttention")}
      </h2>
      <p className="mt-1 text-sm text-zinc-400">
        {t("dashboard.requiresAttentionHint")}
      </p>

      {items.length === 0 ? (
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-brand-cyan/20 bg-brand-cyan/5 p-4">
          <i className="pi pi-check-circle text-brand-cyan" />
          <p className="text-sm text-zinc-300">
            {t("dashboard.nothingRequiresAttention")}
          </p>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {items.map((item) => (
            <li key={item.key}>
              <Link
                href={item.href}
                className="flex gap-3 rounded-xl border border-amber-400/15 bg-amber-400/5 p-4 transition-colors hover:bg-amber-400/10"
              >
                <i className={`${item.icon} mt-0.5 text-amber-400`} />
                <span>
                  <span className="block text-sm font-medium text-zinc-100">
                    {item.title}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-zinc-400">
                    {item.detail}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
