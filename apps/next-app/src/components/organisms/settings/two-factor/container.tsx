"use client";

import { authClient } from "@/src/lib/auth-client";
import { TwoFactorPresentation } from "./presentation";
import { useTwoFactorState } from "@/src/hooks/use-two-factor-state";

interface TwoFactorContainerProps {
  user: {
    id: string;
    email: string;
    twoFactorEnabled?: boolean | null;
  };
}

export function TwoFactorContainer({ user }: TwoFactorContainerProps) {
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
      setError(err.message || err.code || "Failed to enable 2FA");
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
      setError(err.message || err.code || "Invalid code");
      return;
    }
    complete("Authenticator app has been configured successfully.");
  }

  async function handleDisable() {
    setError("");
    const { error: err } = await authClient.twoFactor.disable({ password });
    if (err) {
      setError(err.message || err.code || "Failed to disable 2FA");
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
