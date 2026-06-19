"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/src/lib/auth-client";
import { TwoFactorPresentation } from "./presentation";

export function TwoFactorContainer() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [code, setCode] = useState("");

  async function handleVerify() {
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

  return (
    <TwoFactorPresentation
      error={error}
      code={code}
      onCodeChange={setCode}
      onVerify={handleVerify}
    />
  );
}
