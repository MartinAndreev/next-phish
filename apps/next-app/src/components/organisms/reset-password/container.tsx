"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/src/lib/auth-client";
import { VerifyOtpView } from "./verify-otp-view";
import { ResetPasswordView } from "./reset-password-view";
import { useFormStatus } from "@/src/hooks/use-form-status";
import { useTranslation } from "@/src/lib/i18n";

interface ResetPasswordContainerProps {
  email: string;
}

export function ResetPasswordContainer({ email }: ResetPasswordContainerProps) {
  const t = useTranslation();
  const router = useRouter();
  const { status, setError, reset } = useFormStatus();
  const [otpVerified, setOtpVerified] = useState(false);
  const otpRef = useRef("");

  async function handleVerifyOtp(values: { otp: string }) {
    reset();

    const { error: err } = await authClient.emailOtp.checkVerificationOtp({
      email,
      type: "forget-password",
      otp: values.otp,
    });

    if (err) {
      setError(
        err.message || err.code || t("resetPassword.invalidOrExpiredCode"),
      );
      return;
    }

    otpRef.current = values.otp;
    setOtpVerified(true);
  }

  async function handleResetPassword(values: {
    newPassword: string;
    confirmPassword: string;
  }) {
    reset();

    const { error: err } = await authClient.emailOtp.resetPassword({
      email,
      otp: otpRef.current,
      password: values.newPassword,
    });

    if (err) {
      setError(
        err.message || err.code || t("resetPassword.failedToResetPassword"),
      );
      return;
    }

    router.push("/login?message=password-reset");
  }

  if (!otpVerified) {
    return (
      <VerifyOtpView
        email={email}
        error={status.type === "error" ? status.message : ""}
        onSubmit={handleVerifyOtp}
      />
    );
  }

  return (
    <ResetPasswordView
      error={status.type === "error" ? status.message : ""}
      onSubmit={handleResetPassword}
    />
  );
}
