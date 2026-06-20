"use client";

import { InputOtp } from "primereact/inputotp";
import { Button } from "primereact/button";
import { FormMessage } from "@/src/components/atoms/form-message";
import { useTranslation } from "@/src/lib/i18n";

interface TwoFactorPresentationProps {
  error: string;
  code: string;
  onCodeChange: (v: string) => void;
  onVerify: () => void;
}

export function TwoFactorPresentation({
  error,
  code,
  onCodeChange,
  onVerify,
}: TwoFactorPresentationProps) {
  const t = useTranslation();

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-400">{t("twoFactorPage.intro")}</p>
      <div className="flex justify-center">
        <InputOtp
          value={code}
          onChange={(e) => onCodeChange(e.value?.toString() || "")}
          length={6}
          integerOnly
        />
      </div>
      <Button
        size="small"
        label={t("twoFactorPage.verify")}
        onClick={onVerify}
        disabled={code.length < 6}
        className="w-full mt-4"
      />

      {error && <FormMessage variant="error">{error}</FormMessage>}
    </div>
  );
}
