"use client";

import { Button } from "primereact/button";

function downloadBackupCodes(codes: string[]) {
  const content = [
    "NextPhish Backup Codes",
    "========================",
    "",
    "Keep these codes safe. Each code can only be used once.",
    "",
    ...codes,
    "",
    `Generated: ${new Date().toISOString()}`,
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
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-zinc-100">Backup codes</p>
      <p className="text-xs text-zinc-400">
        Save these codes somewhere safe. Each code can only be used once.
      </p>
      <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/5 p-4">
        {codes.map((code) => (
          <code key={code} className="text-sm tracking-wider text-zinc-200">
            {code}
          </code>
        ))}
      </div>
      <Button
        size="small"
        label="Download backup codes"
        icon="pi pi-download"
        outlined
        onClick={() => downloadBackupCodes(codes)}
        className="rounded-xl border-white/10 px-4 py-2 text-sm text-zinc-300"
      />
    </div>
  );
}
