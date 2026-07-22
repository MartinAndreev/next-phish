"use client";

import Link from "next/link";
import { Skeleton } from "primereact/skeleton";
import type { OrganizationDashboardView } from "@next-phish/backend";
import { useTranslation } from "@/src/lib/i18n";
import { AttentionPanel } from "./attention-panel";
import { ScheduleTimeline } from "@/src/components/organisms/schedules/schedule-timeline";
import { EngagementFunnel } from "./engagement-funnel";
import { MetricCard } from "./metric-card";
import { SetupChecklist } from "./setup-checklist";

interface DashboardPresentationProps {
  organizationName?: string;
  data?: OrganizationDashboardView;
  isLoading: boolean;
  error?: string;
}

export function DashboardPresentation({
  organizationName,
  data,
  isLoading,
  error,
}: DashboardPresentationProps) {
  const t = useTranslation();

  if (isLoading) {
    return (
      <div className="space-y-6 px-6 py-8">
        <Skeleton width="18rem" height="2.5rem" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} height="10rem" borderRadius="1rem" />
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <Skeleton height="28rem" borderRadius="1rem" />
          <Skeleton height="28rem" borderRadius="1rem" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-8">
        <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-6 text-center">
          <i className="pi pi-exclamation-circle text-2xl text-red-400" />
          <p className="mt-3 text-sm text-zinc-300">
            {error ?? t("dashboard.loadError")}
          </p>
        </div>
      </div>
    );
  }

  const isGettingStarted = data.readiness.campaigns === 0;

  return (
    <div className="px-6 py-8">
      <header className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-brand-cyan">
            {organizationName}
          </p>
          <h1 className="mt-1 text-3xl font-semibold text-white">
            {t("dashboard.title")}
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            {t("dashboard.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300">
            <i className="pi pi-calendar mr-2 text-zinc-500" />
            {t("dashboard.lastThirtyDays")}
          </span>
          <Link
            href="/campaigns/new"
            className="rounded-xl bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-azure"
          >
            <i className="pi pi-plus mr-2" />
            {t("dashboard.createCampaign")}
          </Link>
        </div>
      </header>

      {isGettingStarted ? (
        <div className="space-y-6">
          <SetupChecklist readiness={data.readiness} />
          <AttentionPanel attention={data.attention} />
        </div>
      ) : (
        <div className="space-y-6">
          <section
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
            aria-label={t("dashboard.keyMetrics")}
          >
            <MetricCard
              label={t("dashboard.activeCampaignMetric")}
              value={String(data.metrics.activeCampaigns)}
              detail={t("dashboard.activeCampaignMetricHint")}
              icon="pi pi-bolt"
              accent="#29B8FF"
            />
            <MetricCard
              label={t("dashboard.recipientsTargeted")}
              value={String(data.metrics.recipientsTargeted)}
              detail={t("dashboard.inLastThirtyDays")}
              icon="pi pi-users"
              accent="#5C73FF"
            />
            <MetricCard
              label={t("dashboard.deliveryRate")}
              value={`${data.metrics.deliveryRate}%`}
              detail={t("dashboard.ratioDetail", {
                value: data.metrics.delivered,
                total: data.metrics.recipientsTargeted,
              })}
              icon="pi pi-send"
              accent="#15E5D4"
            />
            <MetricCard
              label={t("dashboard.riskRate")}
              value={`${data.metrics.riskRate}%`}
              detail={t("dashboard.riskRateHint", {
                count: data.metrics.riskRecipients,
              })}
              icon="pi pi-exclamation-triangle"
              accent="#7B5CFF"
            />
            <MetricCard
              label={t("dashboard.reportingRate")}
              value={`${data.metrics.reportingRate}%`}
              detail={t("dashboard.reportingRateHint", {
                count: data.metrics.reportedRecipients,
              })}
              icon="pi pi-flag"
              accent="#F59E0B"
            />
          </section>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <EngagementFunnel funnel={data.funnel} />
            <AttentionPanel attention={data.attention} />
          </div>

          <ScheduleTimeline />
        </div>
      )}
    </div>
  );
}
