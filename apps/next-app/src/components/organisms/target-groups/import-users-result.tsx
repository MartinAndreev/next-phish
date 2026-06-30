"use client";

import { ProgressBar } from "primereact/progressbar";
import { Badge } from "primereact/badge";
import { useTranslation } from "@/src/lib/i18n";
import { ImportStatsGrid } from "./import-stats-grid";

interface ImportProgress {
  total: number;
  processed: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
  currentBatch: number;
  totalBatches: number;
  validationErrors?: Array<{ row: number; field: string; message: string }>;
}

interface ImportUsersResultProps {
  status: "importing" | "completed" | "failed";
  progress: ImportProgress | null;
}

export function ImportUsersResult({
  status,
  progress,
}: ImportUsersResultProps) {
  const t = useTranslation();

  if (status === "importing") {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-zinc-300">
          {t("targetGroups.importProgress")}
        </p>
        {progress && (
          <>
            <ProgressBar
              value={
                progress.total > 0
                  ? Math.round((progress.processed / progress.total) * 100)
                  : 0
              }
              showValue
            />
            <ImportStatsGrid
              total={progress.total}
              processed={progress.processed}
              inserted={progress.inserted}
              updated={progress.updated}
              skipped={progress.skipped}
              errors={progress.errors}
            />
          </>
        )}
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="flex items-center gap-2">
        <Badge value="✕" severity="danger" />
        <p className="font-medium text-white">
          {t("targetGroups.importFailed")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Badge value="✓" severity="success" />
        <p className="font-medium text-white">
          {t("targetGroups.importComplete")}
        </p>
      </div>
      {progress && (
        <>
          <ImportStatsGrid
            total={progress.total}
            processed={progress.processed}
            inserted={progress.inserted}
            updated={progress.updated}
            skipped={progress.skipped}
            errors={progress.errors}
          />
          {progress.validationErrors &&
            progress.validationErrors.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-medium text-zinc-300">
                  {t("targetGroups.importValidationErrors")}
                </h4>
                <div className="max-h-40 overflow-y-auto rounded-lg border border-[#1C2945] bg-brand-navy/50 p-3">
                  {progress.validationErrors.map((err) => (
                    <p
                      key={`${err.row}-${err.field}`}
                      className="text-xs text-red-400"
                    >
                      Row {err.row}: {err.field} - {err.message}
                    </p>
                  ))}
                </div>
              </div>
            )}
        </>
      )}
    </div>
  );
}
