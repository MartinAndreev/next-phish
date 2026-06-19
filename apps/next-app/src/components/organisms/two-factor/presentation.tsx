"use client";

import { InputOtp } from "primereact/inputotp";
import { Button } from "primereact/button";
import { FormMessage } from "@/src/components/atoms/form-message";

interface TwoFactorPresentationProps {
  method: "totp" | "otp";
  showToggle: boolean;
  error: string;
  code: string;
  otpSent: boolean;
  onMethodChange: (m: "totp" | "otp") => void;
  onCodeChange: (v: string) => void;
  onVerifyTotp: () => void;
  onSendOtp: () => void;
  onVerifyOtp: () => void;
}

export function TwoFactorPresentation({
  method,
  showToggle,
  error,
  code,
  otpSent,
  onMethodChange,
  onCodeChange,
  onVerifyTotp,
  onSendOtp,
  onVerifyOtp,
}: TwoFactorPresentationProps) {
  return (
    <div className="space-y-6">
      {showToggle && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onMethodChange("totp")}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
              method === "totp"
                ? "border-cyan-500 bg-cyan-500/20 text-cyan-200"
                : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
            }`}
          >
            Authenticator app
          </button>
          <button
            type="button"
            onClick={() => onMethodChange("otp")}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
              method === "otp"
                ? "border-cyan-500 bg-cyan-500/20 text-cyan-200"
                : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
            }`}
          >
            Email code
          </button>
        </div>
      )}

      {method === "totp" && (
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
            onClick={onVerifyTotp}
            disabled={code.length < 6}
            className="w-full mt-4"
          />
        </div>
      )}

      {method === "otp" && (
        <div className="space-y-4">
          {!otpSent ? (
            <>
              <p className="text-sm text-zinc-400">
                We&apos;ll send a verification code to your email.
              </p>
              <Button
                label="Send code"
                onClick={onSendOtp}
                className="w-full"
              />
            </>
          ) : (
            <>
              <p className="text-sm text-zinc-400">
                Enter the code sent to your email.
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
                onClick={onVerifyOtp}
                disabled={code.length < 6}
                className="w-full mt-4"
              />
            </>
          )}
        </div>
      )}

      {error && <FormMessage variant="error">{error}</FormMessage>}
    </div>
  );
}
