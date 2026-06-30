"use client";

import { useTranslation } from "@/src/lib/i18n";

interface ImportStatsGridProps {
  total: number;
  processed: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
}

export function ImportStatsGrid({
  total,
  processed,
  inserted,
  updated,
  skipped,
  errors,
}: ImportStatsGridProps) {
  const t = useTranslation();

  return (
    <div className="grid grid-cols-2 gap-3 text-sm">
      {total > 0 && (
        <>
          <StatItem label={t("targetGroups.importTotal")} value={total} />
          <StatItem
            label={t("targetGroups.importProcessed")}
            value={processed}
          />
        </>
      )}
      <StatItem
        label={t("targetGroups.importInserted")}
        value={inserted}
        color="text-brand-cyan"
      />
      <StatItem
        label={t("targetGroups.importUpdated")}
        value={updated}
        color="text-brand-blue"
      />
      {skipped > 0 && (
        <StatItem
          label={t("targetGroups.importSkipped")}
          value={skipped}
          color="text-zinc-400"
        />
      )}
      <StatItem
        label={t("targetGroups.importErrors")}
        value={errors}
        color="text-red-400"
      />
    </div>
  );
}

function StatItem({
  label,
  value,
  color = "text-white",
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div>
      <span className="text-zinc-400">{label}: </span>
      <span className={color}>{value}</span>
    </div>
  );
}
