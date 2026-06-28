"use client";

import { useState } from "react";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { ProgressBar } from "primereact/progressbar";
import { FormMessage } from "@/src/components/atoms/form-message";

interface PreviousImport {
  id: string;
  url: string;
  finalUrl: string | null;
  status: string;
  includeAssets: boolean;
  html: string | null;
  assetDownloaded: number;
  fileCount: number;
  createdAt: Date;
}

interface ImportJobStatus {
  job: {
    id: string;
    status: string;
    progress: unknown | null;
    output: unknown | null;
  } | null;
  siteImport: {
    id: string;
    status: string;
    html: string | null;
    assetDiscovered: number;
    assetDownloaded: number;
    assetFailed: number;
    assetSkipped: number;
  } | null;
}

interface ImportWebsiteDialogProps {
  visible: boolean;
  t: (key: string) => string;
  previousImports: PreviousImport[];
  onImport: (url: string, includeAssets: boolean) => Promise<string>;
  onImportComplete: (html: string) => void;
  onPollStatus: (jobId: string) => Promise<ImportJobStatus>;
  onHide: () => void;
}

export function ImportWebsiteDialog({
  visible,
  t,
  previousImports,
  onImport,
  onImportComplete,
  onPollStatus,
  onHide,
}: ImportWebsiteDialogProps) {
  const [url, setUrl] = useState("");
  const [includeAssets, setIncludeAssets] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [showPrevious, setShowPrevious] = useState(false);
  const [progress, setProgress] = useState<{
    status: string;
    discovered: number;
    downloaded: number;
    failed: number;
  } | null>(null);

  async function handleImport() {
    if (!url.trim()) {
      setError(t("pages.importWebsiteUrlRequired"));
      return;
    }

    setError("");
    setImporting(true);

    try {
      const id = await onImport(url.trim(), includeAssets);
      setJobId(id);

      if (!includeAssets) {
        const status = await onPollStatus(id);
        if (status.siteImport?.html) {
          onImportComplete(status.siteImport.html);
        }
        resetAndClose();
      } else {
        pollJobStatus(id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("pages.importWebsiteError"));
      setImporting(false);
    }
  }

  function handleSelectPrevious(imp: PreviousImport) {
    if (imp.html) {
      onImportComplete(imp.html);
      resetAndClose();
    }
  }

  async function pollJobStatus(id: string) {
    const maxAttempts = 120;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      try {
        const status = await onPollStatus(id);

        if (status.siteImport) {
          setProgress({
            status: status.siteImport.status,
            discovered: status.siteImport.assetDiscovered,
            downloaded: status.siteImport.assetDownloaded,
            failed: status.siteImport.assetFailed,
          });
        }

        if (status.job?.status === "COMPLETED") {
          const output = status.job.output as { html?: string } | null;
          if (output?.html) {
            onImportComplete(output.html);
          } else if (status.siteImport?.html) {
            onImportComplete(status.siteImport.html);
          }
          resetAndClose();
          return;
        }

        if (status.job?.status === "FAILED") {
          setError(t("pages.importWebsiteError"));
          setImporting(false);
          setJobId(null);
          setProgress(null);
          return;
        }
      } catch {
        // continue polling
      }
    }

    setError(t("pages.importWebsiteError"));
    setImporting(false);
    setJobId(null);
    setProgress(null);
  }

  function resetAndClose() {
    setUrl("");
    setIncludeAssets(false);
    setImporting(false);
    setJobId(null);
    setProgress(null);
    setError("");
    setShowPrevious(false);
    onHide();
  }

  const footer = (
    <div className="flex gap-2">
      <Button
        size="small"
        type="button"
        outlined
        label={t("common.cancel")}
        onClick={() => {
          setUrl("");
          setError("");
          setJobId(null);
          setProgress(null);
          setShowPrevious(false);
          onHide();
        }}
        className="rounded-xl border-white/10 px-5 py-3 text-sm font-medium text-white"
      />
      {!jobId && (
        <Button
          size="small"
          type="button"
          label={t("pages.importWebsiteButton")}
          icon="pi pi-download"
          loading={importing}
          disabled={importing}
          onClick={handleImport}
          className="rounded-xl border-0 bg-(image:--brand-gradient) px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(41,184,255,0.25)]"
        />
      )}
    </div>
  );

  function handleHide() {
    setUrl("");
    setError("");
    setJobId(null);
    setProgress(null);
    setShowPrevious(false);
    onHide();
  }

  const hasPrevious = previousImports.length > 0;

  return (
    <Dialog
      header={t("pages.importWebsiteTitle")}
      visible={visible}
      draggable={false}
      dismissableMask
      onHide={handleHide}
      footer={footer}
      className="max-w-lg"
    >
      <div className="space-y-4">
        {!jobId ? (
          <>
            <p className="text-sm leading-relaxed text-zinc-600">
              {t("pages.importWebsiteHint")}
            </p>

            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
              <p className="text-xs leading-relaxed text-amber-400">
                {t("pages.importWebsiteWarning")}
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="importUrl"
                className="block text-sm font-medium text-zinc-500"
              >
                {t("pages.urlLabel")}
              </label>
              <InputText
                id="importUrl"
                size="small"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={t("pages.urlPlaceholder")}
                className="w-full rounded-xl border border-white/10 bg-white/95 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 py-3">
              <Checkbox
                inputId="includeAssets"
                pt={{
                  root: {
                    className:
                      "flex items-center gap-2 bg-slate-600/10 rounded-sm p-0",
                  },
                  input: {
                    className: "h-5 w-5",
                  },
                  box: {
                    className:
                      "h-5 w-5 items-center justify-center content-center flex",
                  },
                }}
                checked={includeAssets}
                onChange={(e) => setIncludeAssets(e.checked ?? false)}
              />
              <div>
                <label
                  htmlFor="includeAssets"
                  className="block text-sm font-medium text-zinc-500 cursor-pointer"
                >
                  {t("pages.includeAssets")}
                </label>
                <p className="mt-1 text-xs text-zinc-400">
                  {t("pages.includeAssetsHint")}
                </p>
              </div>
            </div>

            {hasPrevious && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowPrevious(!showPrevious)}
                  className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer hover:text-zinc-800 transition-colors"
                >
                  <i
                    className={`pi ${showPrevious ? "pi-chevron-down" : "pi-chevron-right"} text-xs`}
                  />
                  {t("pages.previousImports")} ({previousImports.length})
                </button>

                {showPrevious && (
                  <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-2">
                    {previousImports.map((imp) => (
                      <button
                        key={imp.id}
                        type="button"
                        onClick={() => handleSelectPrevious(imp)}
                        className="flex w-full items-center cursor-pointer justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-white/10"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-zinc-600">{imp.url}</p>
                          <p className="text-xs text-zinc-500">
                            {imp.includeAssets
                              ? `${imp.fileCount} files`
                              : "HTML only"}
                            {" · "}
                            {new Date(imp.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <i className="pi pi-check-circle ml-2 text-xs text-green-400" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {error && <FormMessage variant="error">{error}</FormMessage>}
          </>
        ) : (
          <div className="space-y-4 py-4">
            <p className="text-sm text-zinc-300">{t("pages.importProgress")}</p>

            <ProgressBar mode="indeterminate" className="h-2" />

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
        )}
      </div>
    </Dialog>
  );
}
