"use client";

import { authClient } from "@/src/lib/auth-client";
import { TwoFactorPresentation } from "./presentation";
import { useTwoFactorState } from "@/src/hooks/use-two-factor-state";
import { useTranslation } from "@/src/lib/i18n";

interface TwoFactorContainerProps {
  user: {
    id: string;
    email: string;
    twoFactorEnabled?: boolean | null;
  };
}

export function TwoFactorContainer({ user }: TwoFactorContainerProps) {
  const t = useTranslation();
  const { data: session } = authClient.useSession();
  const isEnabled = session?.user?.twoFactorEnabled ?? user.twoFactorEnabled;
  const {
    state: { step, status, totpUri, backupCodes, verifyCode, password },
    setPassword,
    setVerifyCode,
    setError,
    setupTotp,
    enableTotp,
    confirmDisable,
    complete,
    reset,
  } = useTwoFactorState();

  async function handleEnableTotpWithPassword() {
    setError("");
    const { data, error: err } = await authClient.twoFactor.enable({
      password,
    });
    if (err) {
      setError(err.message || err.code || t("settings.failedToEnable2fa"));
      return;
    }

    if (data) {
      setupTotp(data.totpURI, data.backupCodes);
    }
  }

  async function handleVerify() {
    setError("");
    const { error: err } = await authClient.twoFactor.verifyTotp({
      code: verifyCode,
    });
    if (err) {
      setError(err.message || err.code || t("twoFactorPage.invalidCode"));
      return;
    }
    complete(t("settings.authenticatorConfigured"));
  }

  async function handleDisable() {
    setError("");
    const { error: err } = await authClient.twoFactor.disable({ password });
    if (err) {
      setError(err.message || err.code || t("settings.failedToDisable2fa"));
      return;
    }
    reset();
  }

  return (
    <TwoFactorPresentation
      isEnabled={!!isEnabled}
      step={step}
      error={status.type === "error" ? status.message : ""}
      success={status.type === "success" ? status.message : ""}
      totpUri={totpUri}
      backupCodes={backupCodes}
      verifyCode={verifyCode}
      password={password}
      onPasswordChange={setPassword}
      onVerifyCodeChange={setVerifyCode}
      onEnableTotp={enableTotp}
      onEnableTotpWithPassword={handleEnableTotpWithPassword}
      onVerify={handleVerify}
      onDisable={handleDisable}
      onConfirmDisable={confirmDisable}
      onReset={reset}
    />
  );
}
