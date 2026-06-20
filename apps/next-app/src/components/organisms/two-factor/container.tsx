"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/src/lib/auth-client";
import { TwoFactorPresentation } from "./presentation";
import { useTranslation } from "@/src/lib/i18n";

export function TwoFactorContainer() {
  const t = useTranslation();
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
      setError(err.message || err.code || t("twoFactorPage.invalidCode"));
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
