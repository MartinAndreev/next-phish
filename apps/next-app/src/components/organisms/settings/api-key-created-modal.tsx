"use client";

import { useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { useTranslation } from "@/src/lib/i18n";

interface ApiKeyCreatedModalProps {
  apiKey: string | null;
  onHide: () => void;
}

export function ApiKeyCreatedModal({
  apiKey,
  onHide,
}: ApiKeyCreatedModalProps) {
  const t = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!apiKey) return;
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog
      header={t("apiKeys.keyCreated")}
      visible={!!apiKey}
      onHide={onHide}
      style={{ width: "32rem" }}
      modal
      closable={false}
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-start gap-3">
            <i className="pi pi-exclamation-triangle mt-0.5 text-amber-400" />
            <div>
              <p className="font-medium text-amber-200">
                {t("apiKeys.saveKeyWarning")}
              </p>
              <p className="mt-1 text-sm text-amber-300/80">
                {t("apiKeys.saveKeyHint")}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            {t("apiKeys.yourApiKey")}
          </p>
          <code className="block break-all font-mono text-sm text-cyan-300">
            {apiKey}
          </code>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            size="small"
            label={copied ? t("apiKeys.copied") : t("apiKeys.copyKey")}
            icon={copied ? "pi pi-check" : "pi pi-copy"}
            severity={copied ? "success" : "secondary"}
            outlined
            onClick={handleCopy}
          />
          <Button size="small" label={t("apiKeys.done")} onClick={onHide} />
        </div>
      </div>
    </Dialog>
  );
}
