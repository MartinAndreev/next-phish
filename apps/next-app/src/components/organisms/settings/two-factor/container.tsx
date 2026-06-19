"use client";

import { useState } from "react";
import { authClient } from "@/src/lib/auth-client";
import { TwoFactorPresentation } from "./presentation";

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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [totpUri, setTotpUri] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verifyCode, setVerifyCode] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<
    | "idle"
    | "password-enable-totp"
    | "setup"
    | "done"
    | "password-disable"
    | "password-enable-otp"
  >("idle");

  function reset() {
    setStep("idle");
    setTotpUri("");
    setBackupCodes([]);
    setVerifyCode("");
    setPassword("");
    setError("");
    setSuccess("");
  }

  function handleDone() {
    setStep("idle");
    setSuccess("");
    setError("");
  }

  async function handleEnableTotp() {
    setError("");
    setStep("password-enable-totp");
  }

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
      setTotpUri(data.totpURI);
      setBackupCodes(data.backupCodes);
      setStep("setup");
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
    setStep("done");
    setSuccess("Authenticator app has been configured successfully.");
    setVerifyCode("");
    setPassword("");
    setTotpUri("");
    setBackupCodes([]);
  }

  async function handleEnableOtp() {
    setError("");
    setStep("password-enable-otp");
  }

  async function handleEnableOtpWithPassword() {
    setError("");
    const { error: err } = await authClient.twoFactor.enable({ password });
    if (err) {
      setError(err.message || err.code || "Failed to enable 2FA");
      return;
    }

    setStep("done");
    setSuccess(
      "Email verification has been enabled. You will receive codes via email when signing in.",
    );
    setPassword("");
  }

  async function handleConfirmDisable() {
    setError("");
    setStep("password-disable");
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
      error={error}
      success={success}
      totpUri={totpUri}
      backupCodes={backupCodes}
      verifyCode={verifyCode}
      password={password}
      onPasswordChange={setPassword}
      onVerifyCodeChange={setVerifyCode}
      onEnableTotp={handleEnableTotp}
      onEnableTotpWithPassword={handleEnableTotpWithPassword}
      onEnableOtp={handleEnableOtp}
      onEnableOtpWithPassword={handleEnableOtpWithPassword}
      onVerify={handleVerify}
      onDisable={handleDisable}
      onConfirmDisable={handleConfirmDisable}
      onDone={handleDone}
      onReset={reset}
    />
  );
}
