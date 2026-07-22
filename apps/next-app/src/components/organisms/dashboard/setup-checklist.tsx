"use client";

import Link from "next/link";
import type { OrganizationDashboardView } from "@next-phish/backend";
import { useTranslation } from "@/src/lib/i18n";

interface SetupChecklistProps {
  readiness: OrganizationDashboardView["readiness"];
}

export function SetupChecklist({ readiness }: SetupChecklistProps) {
  const t = useTranslation();
  const items = [
    {
      key: "targetGroups",
      label: t("dashboard.setupTargetGroup"),
      href: "/target-groups/new",
      complete: readiness.targetGroups > 0,
    },
    {
      key: "emailTemplates",
      label: t("dashboard.setupEmailTemplate"),
      href: "/email-templates/new",
      complete: readiness.emailTemplates > 0,
    },
    {
      key: "pages",
      label: t("dashboard.setupPage"),
      href: "/pages/new",
      complete: readiness.pages > 0,
    },
    {
      key: "sendingProfiles",
      label: t("dashboard.setupSendingProfile"),
      href: "/sending-profiles/new",
      complete: readiness.sendingProfiles > 0,
    },
    {
      key: "campaigns",
      label: t("dashboard.setupCampaign"),
      href: "/campaigns/new",
      complete: readiness.campaigns > 0,
    },
  ];
  const completed = items.filter((item) => item.complete).length;

  return (
    <section className="overflow-hidden rounded-2xl border border-brand-blue/25 bg-brand-dark shadow-xl">
      <div className="bg-(image:--brand-gradient) p-px">
        <div className="rounded-t-[15px] bg-brand-dark p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-cyan">
            {t("dashboard.gettingStarted")}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {t("dashboard.prepareFirstCampaign")}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            {t("dashboard.prepareFirstCampaignHint")}
          </p>
        </div>
      </div>
      <div className="p-6">
        <div className="mb-5 flex items-center justify-between text-sm">
          <span className="text-zinc-400">{t("dashboard.setupProgress")}</span>
          <span className="font-semibold text-brand-cyan">
            {completed}/{items.length}
          </span>
        </div>
        <div className="mb-6 h-2 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-(image:--brand-gradient)"
            style={{ width: `${(completed / items.length) * 100}%` }}
          />
        </div>
        <ol className="grid gap-3 md:grid-cols-2">
          {items.map((item, index) => (
            <li key={item.key}>
              <Link
                href={item.href}
                className="flex items-center gap-3 rounded-xl border border-white/10 p-4 transition-colors hover:bg-white/5"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    item.complete
                      ? "bg-brand-cyan/15 text-brand-cyan"
                      : "bg-white/5 text-zinc-400"
                  }`}
                >
                  {item.complete ? <i className="pi pi-check" /> : index + 1}
                </span>
                <span
                  className={`text-sm font-medium ${
                    item.complete ? "text-zinc-400 line-through" : "text-white"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
