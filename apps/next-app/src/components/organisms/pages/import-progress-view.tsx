"use client";

import { ProgressBar } from "primereact/progressbar";

interface ImportProgressViewProps {
  progress: {
    status: string;
    discovered: number;
    downloaded: number;
    failed: number;
  } | null;
  t: (key: string) => string;
}

export function ImportProgressView({ progress, t }: ImportProgressViewProps) {
  return (
    <div className="space-y-4 py-4">
      <p className="text-sm text-zinc-300">{t("pages.importProgress")}</p>

      <ProgressBar
        mode="indeterminate"
        className="h-2"
        pt={{
          container: { className: "bg-[#1C2945] rounded-full" },
          value: { className: "bg-(image:--brand-gradient)" },
        }}
      />

      {progress && (
        <div className="space-y-2 text-sm text-zinc-400">
          <p>
            {progress.discovered > 0
              ? t("pages.importDownloadingAssets")
              : t("pages.importFetchingHtml")}
          </p>
          {progress.discovered > 0 && (
            <p>
              {t("pages.importAssetsFetched")
                .replace("{downloaded}", String(progress.downloaded))
                .replace("{total}", String(progress.discovered))}
              {progress.failed > 0 && (
                <span className="text-amber-400">
                  {" "}
                  ({progress.failed} failed)
                </span>
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
