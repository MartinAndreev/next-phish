"use client";

import { useState } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { FormMessage } from "@/src/components/atoms/form-message";

interface ImportWebsiteDialogProps {
  visible: boolean;
  t: (key: string) => string;
  onImport: (url: string) => Promise<void>;
  onHide: () => void;
}

export function ImportWebsiteDialog({
  visible,
  t,
  onImport,
  onHide,
}: ImportWebsiteDialogProps) {
  const [url, setUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");

  async function handleImport() {
    if (!url.trim()) {
      setError(t("pages.importWebsiteUrlRequired"));
      return;
    }

    setError("");
    setImporting(true);

    try {
      await onImport(url.trim());
      setUrl("");
      setImporting(false);
      onHide();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("pages.importWebsiteError"));
      setImporting(false);
    }
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
          onHide();
        }}
        className="rounded-xl border-white/10 px-5 py-3 text-sm font-medium text-white"
      />
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
    </div>
  );

  function handleHide() {
    setUrl("");
    setError("");
    onHide();
  }

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
        <p className="text-sm leading-relaxed text-zinc-300">
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
            className="block text-sm font-medium text-zinc-100"
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
          {error && <FormMessage variant="error">{error}</FormMessage>}
        </div>
      </div>
    </Dialog>
  );
}
