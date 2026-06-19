"use client";

import { InputOtp } from "primereact/inputotp";
import { Button } from "primereact/button";
import { FormMessage } from "@/src/components/atoms/form-message";

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
  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-400">
        Enter the code from your authenticator app.
      </p>
      <div className="flex justify-center">
        <InputOtp
          value={code}
          onChange={(e) => onCodeChange(e.value?.toString() || "")}
          length={6}
          integerOnly
        />
      </div>
      <Button
        label="Verify"
        onClick={onVerify}
        disabled={code.length < 6}
        className="w-full mt-4"
      />

      {error && <FormMessage variant="error">{error}</FormMessage>}
    </div>
  );
}
