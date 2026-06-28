"use client";

import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { ProgressBar } from "primereact/progressbar";
import { FormMessage } from "@/src/components/atoms/form-message";
import { PreviousImportsList } from "./previous-imports-list";
import { useImportDialog } from "@/src/hooks/use-import-dialog";

interface ImportWebsiteDialogProps {
  visible: boolean;
  t: (key: string) => string;
  onImportComplete: (html: string) => void;
  onHide: () => void;
}

export function ImportWebsiteDialog({
  visible,
  t,
  onImportComplete,
  onHide,
}: ImportWebsiteDialogProps) {
  const {
    state,
    dispatch,
    previousImports,
    handleImport,
    handleSelectPrevious,
    handleSearch,
    handleHide,
  } = useImportDialog({ t, onImportComplete, onHide });

  const footer = (
    <div className="flex gap-2">
      <Button
        size="small"
        type="button"
        outlined
        label={t("common.cancel")}
        onClick={handleHide}
        className="rounded-xl border-white/10 px-5 py-3 text-sm font-medium text-white"
      />
      {!state.jobId && (
        <Button
          size="small"
          type="button"
          label={t("pages.importWebsiteButton")}
          icon="pi pi-download"
          loading={state.importing}
          disabled={state.importing}
          onClick={handleImport}
          className="rounded-xl border-0 bg-(image:--brand-gradient) px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(41,184,255,0.25)]"
        />
      )}
    </div>
  );

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
        {!state.jobId ? (
          <>
            <p className="text-sm leading-relaxed text-zinc-300">
              {t("pages.importWebsiteHint")}
            </p>

            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
              <p className="text-xs leading-relaxed text-amber-400">
                {t("pages.importWebsiteWarning")}
              </p>
            </div>

            <UrlInput
              url={state.url}
              t={t}
              onChange={(url) => dispatch({ type: "SET_URL", url })}
            />

            <AssetsToggle
              checked={state.includeAssets}
              t={t}
              onChange={(value) =>
                dispatch({ type: "SET_INCLUDE_ASSETS", value })
              }
            />

            <PreviousImportsList
              imports={previousImports}
              t={t}
              onSelect={handleSelectPrevious}
              onSearch={handleSearch}
            />

            {state.error && (
              <FormMessage variant="error">{state.error}</FormMessage>
            )}
          </>
        ) : (
          <ImportProgressView progress={state.progress} t={t} />
        )}
      </div>
    </Dialog>
  );
}

function UrlInput({
  url,
  t,
  onChange,
}: {
  url: string;
  t: (key: string) => string;
  onChange: (url: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor="importUrl"
        className="block text-sm font-medium text-zinc-100"
      >
        {t("pages.urlLabel")}
      </label>
      <InputText
        id="importUrl"
        size="small"
        value={url}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("pages.urlPlaceholder")}
        className="w-full rounded-xl border border-white/10 bg-white/95 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] placeholder:text-slate-400"
      />
    </div>
  );
}

function AssetsToggle({
  checked,
  t,
  onChange,
}: {
  checked: boolean;
  t: (key: string) => string;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
      <Checkbox
        inputId="includeAssets"
        checked={checked}
        onChange={(e) => onChange(e.checked ?? false)}
      />
      <div>
        <label
          htmlFor="includeAssets"
          className="block text-sm font-medium text-zinc-100 cursor-pointer"
        >
          {t("pages.includeAssets")}
        </label>
        <p className="mt-1 text-xs text-zinc-400">
          {t("pages.includeAssetsHint")}
        </p>
      </div>
    </div>
  );
}

function ImportProgressView({
  progress,
  t,
}: {
  progress: {
    status: string;
    discovered: number;
    downloaded: number;
    failed: number;
  } | null;
  t: (key: string) => string;
}) {
  return (
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
  );
}
