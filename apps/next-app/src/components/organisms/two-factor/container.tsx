"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/src/lib/auth-client";
import { TwoFactorPresentation } from "./presentation";

interface TwoFactorContainerProps {
  methods: string[];
}

export function TwoFactorContainer({ methods }: TwoFactorContainerProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const hasTotp = methods.includes("totp");
  const hasOtp = methods.includes("otp");
  const defaultMethod = hasTotp ? "totp" : "otp";
  const [method, setMethod] = useState<"totp" | "otp">(defaultMethod);
  const showToggle = hasTotp && hasOtp;

  async function handleSendOtp() {
    setError("");
    const { error: err } = await authClient.twoFactor.sendOtp();
    if (err) {
      setError(err.message || err.code || "Failed to send code");
      return;
    }
    setOtpSent(true);
  }

  function handleMethodChange(m: "totp" | "otp") {
    setMethod(m);
    if (m === "otp" && !otpSent) {
      handleSendOtp();
    }
  }

  async function handleVerifyTotp() {
    setError("");
    const { error: err } = await authClient.twoFactor.verifyTotp({
      code,
      trustDevice: true,
    });
    if (err) {
      setError(err.message || err.code || "Invalid code");
      return;
    }
    router.push("/");
  }

  async function handleVerifyOtp() {
    setError("");
    const { error: err } = await authClient.twoFactor.verifyOtp({
      code,
      trustDevice: true,
    });
    if (err) {
      setError(err.message || err.code || "Invalid code");
      return;
    }
    router.push("/");
  }

  return (
    <TwoFactorPresentation
      method={method}
      showToggle={showToggle}
      error={error}
      code={code}
      otpSent={otpSent}
      onMethodChange={handleMethodChange}
      onCodeChange={setCode}
      onVerifyTotp={handleVerifyTotp}
      onSendOtp={handleSendOtp}
      onVerifyOtp={handleVerifyOtp}
    />
  );
}
