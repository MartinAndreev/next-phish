"use client";

import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import QRCode from "react-qr-code";
import { BackupCodes } from "./backup-codes";

const inputClassName =
  "w-full rounded-xl border border-white/10 bg-white/95 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] placeholder:text-slate-400";

interface TotpSetupProps {
  totpUri: string;
  backupCodes: string[];
  verifyCode: string;
  onVerifyCodeChange: (v: string) => void;
  onVerify: () => void;
  onCancel: () => void;
}

export function TotpSetup({
  totpUri,
  backupCodes,
  verifyCode,
  onVerifyCodeChange,
  onVerify,
  onCancel,
}: TotpSetupProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-sm text-zinc-400">
          Scan this QR code with your authenticator app (Google Authenticator,
          Authy, etc.).
        </p>
        <div className="inline-block rounded-xl bg-white p-4">
          <QRCode value={totpUri} size={200} />
        </div>
      </div>

      {backupCodes.length > 0 && <BackupCodes codes={backupCodes} />}

      <div className="space-y-3">
        <p className="text-sm text-zinc-400">
          Enter the code from your authenticator app to verify setup.
        </p>
        <InputText
          size="small"
          value={verifyCode}
          onChange={(e) => onVerifyCodeChange(e.target.value)}
          placeholder="000000"
          className={inputClassName}
        />
        <div className="flex gap-2 mt-5">
          <Button
            size="small"
            label="Verify & activate"
            onClick={onVerify}
            disabled={verifyCode.length < 6}
            className="rounded-xl border-0 bg-(image:--brand-gradient) px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(41,184,255,0.25)] transition-transform duration-200 hover:-translate-y-0.5"
          />
          <Button
            size="small"
            label="Cancel"
            outlined
            onClick={onCancel}
            className="rounded-xl border-white/10 px-6 py-3 text-sm text-zinc-300"
          />
        </div>
      </div>
    </div>
  );
}
