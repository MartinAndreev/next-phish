"use client";

import { Password } from "primereact/password";
import { Button } from "primereact/button";

const inputClassName =
  "w-full rounded-xl border border-white/10 bg-white/95 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] placeholder:text-slate-400";

interface PasswordPromptProps {
  password: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  label?: string;
}

export function PasswordPrompt({
  password,
  onChange,
  onSubmit,
  onCancel,
  label,
}: PasswordPromptProps) {
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-zinc-400">
        {label || "Enter your password to continue."}
      </p>
      <div className="space-y-2">
        <label
          htmlFor="password-input"
          className="block text-sm font-medium text-zinc-100"
        >
          Password
        </label>
        <Password
          inputId="password-input"
          size={"small" as never}
          value={password}
          onChange={(e) => onChange(e.target.value)}
          toggleMask
          feedback={false}
          className="w-full"
          inputClassName={inputClassName}
          pt={{ iconField: { root: { className: "w-full" } } }}
          placeholder="Enter your password"
        />
      </div>
      <div className="flex gap-2">
        <Button
          size="small"
          type="submit"
          label="Continue"
          className="rounded-xl border-0 bg-(image:--brand-gradient) px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(41,184,255,0.25)] transition-transform duration-200 hover:-translate-y-0.5"
        />
        <Button
          size="small"
          type="button"
          label="Cancel"
          outlined
          onClick={onCancel}
          className="rounded-xl border-white/10 px-6 py-3 text-sm text-zinc-300"
        />
      </div>
    </form>
  );
}
