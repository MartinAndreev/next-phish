"use client";

import { Button } from "primereact/button";
import { useTranslation } from "@/src/lib/i18n";

function downloadBackupCodes(
  codes: string[],
  t: (key: string, params?: Record<string, string | number>) => string,
) {
  const content = [
    t("settings.backupCodesFileTitle"),
    "========================",
    "",
    t("settings.backupCodesFileHint"),
    "",
    ...codes,
    "",
    t("settings.generatedAt", { date: new Date().toISOString() }),
  ].join("\n");

  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "nextphish-backup-codes.txt";
  a.click();
  URL.revokeObjectURL(url);
}

interface BackupCodesProps {
  codes: string[];
}

export function BackupCodes({ codes }: BackupCodesProps) {
  const t = useTranslation();

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-zinc-100">
        {t("settings.backupCodes")}
      </p>
      <p className="text-xs text-zinc-400">{t("settings.backupCodesHint")}</p>
      <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/5 p-4">
        {codes.map((code) => (
          <code key={code} className="text-sm tracking-wider text-zinc-200">
            {code}
          </code>
        ))}
      </div>
      <Button
        size="small"
        label={t("settings.downloadBackupCodes")}
        icon="pi pi-download"
        outlined
        onClick={() => downloadBackupCodes(codes, t)}
        className="rounded-xl border-white/10 px-4 py-2 text-sm text-zinc-300"
      />
    </div>
  );
}
