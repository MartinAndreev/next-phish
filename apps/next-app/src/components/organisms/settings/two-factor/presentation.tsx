"use client";

import { Button } from "primereact/button";
import { FormMessage } from "@/src/components/atoms/form-message";
import { PasswordPrompt } from "./password-prompt";
import { TotpSetup } from "./totp-setup";

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
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h3 className="text-lg font-medium text-white">
          Two-Factor Authentication
        </h3>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            isEnabled
              ? "bg-emerald-500/20 text-emerald-300"
              : "bg-zinc-500/20 text-zinc-400"
          }`}
        >
          {isEnabled ? "Enabled" : "Disabled"}
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
                    Authenticator app
                  </p>
                  <p className="text-xs text-zinc-400">
                    Use an app like Google Authenticator or Authy
                  </p>
                </div>
              </div>
              {isEnabled ? (
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
                  Active
                </span>
              ) : (
                <Button
                  label="Set up"
                  size="small"
                  onClick={onEnableTotp}
                  className="rounded-lg px-3 py-1.5 text-xs"
                />
              )}
            </div>
          </div>

          {success && <FormMessage variant="success">{success}</FormMessage>}

          {isEnabled && (
            <Button
              label="Disable two-factor authentication"
              severity="danger"
              size="small"
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
          label="Enter your password to set up the authenticator app."
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
          label="Enter your password to disable two-factor authentication."
        />
      )}

      {error && <FormMessage variant="error">{error}</FormMessage>}
    </div>
  );
}
