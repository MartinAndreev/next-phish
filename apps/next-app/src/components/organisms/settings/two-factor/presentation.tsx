"use client";

import { Button } from "primereact/button";
import { FormMessage } from "@/src/components/atoms/form-message";
import { PasswordPrompt } from "./password-prompt";
import { TotpSetup } from "./totp-setup";
import { useTranslation } from "@/src/lib/i18n";

interface TwoFactorPresentationProps {
  isEnabled: boolean;
  step: "idle" | "password-enable-totp" | "setup" | "password-disable";
  error: string;
  success: string;
  totpUri: string;
  backupCodes: string[];
  verifyCode: string;
  password: string;
  onPasswordChange: (v: string) => void;
  onVerifyCodeChange: (v: string) => void;
  onEnableTotp: () => void;
  onEnableTotpWithPassword: () => void;
  onVerify: () => void;
  onDisable: () => void;
  onConfirmDisable: () => void;
  onReset: () => void;
}

export function TwoFactorPresentation({
  isEnabled,
  step,
  error,
  success,
  totpUri,
  backupCodes,
  verifyCode,
  password,
  onPasswordChange,
  onVerifyCodeChange,
  onEnableTotp,
  onEnableTotpWithPassword,
  onVerify,
  onDisable,
  onConfirmDisable,
  onReset,
}: TwoFactorPresentationProps) {
  const t = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h3 className="text-lg font-medium text-white">
          {t("settings.twoFactorTitle")}
        </h3>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            isEnabled
              ? "bg-emerald-500/20 text-emerald-300"
              : "bg-zinc-500/20 text-zinc-400"
          }`}
        >
          {isEnabled ? t("common.enabled") : t("common.disabled")}
        </span>
      </div>

      {step === "idle" && (
        <div className="space-y-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <i className="pi pi-mobile text-lg text-zinc-300" />
                <div>
                  <p className="text-sm font-medium text-zinc-100">
                    {t("settings.authenticatorApp")}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {t("settings.authenticatorHint")}
                  </p>
                </div>
              </div>
              {isEnabled ? (
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
                  {t("common.active")}
                </span>
              ) : (
                <Button
                  size="small"
                  label={t("settings.setupAction")}
                  onClick={onEnableTotp}
                  className="rounded-lg px-3 py-1.5 text-xs"
                />
              )}
            </div>
          </div>

          {success && <FormMessage variant="success">{success}</FormMessage>}

          {isEnabled && (
            <Button
              size="small"
              label={t("settings.disableAction")}
              severity="danger"
              onClick={onConfirmDisable}
              className="w-fit rounded-lg px-3 py-1.5 text-xs"
            />
          )}
        </div>
      )}

      {step === "password-enable-totp" && (
        <PasswordPrompt
          password={password}
          onChange={onPasswordChange}
          onSubmit={onEnableTotpWithPassword}
          onCancel={onReset}
          label={t("settings.enablePasswordPrompt")}
        />
      )}

      {step === "setup" && (
        <TotpSetup
          totpUri={totpUri}
          backupCodes={backupCodes}
          verifyCode={verifyCode}
          onVerifyCodeChange={onVerifyCodeChange}
          onVerify={onVerify}
          onCancel={onReset}
        />
      )}

      {step === "password-disable" && (
        <PasswordPrompt
          password={password}
          onChange={onPasswordChange}
          onSubmit={onDisable}
          onCancel={onReset}
          label={t("settings.disablePasswordPrompt")}
        />
      )}

      {error && <FormMessage variant="error">{error}</FormMessage>}
    </div>
  );
}
