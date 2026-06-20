"use client";

import { useRef } from "react";
import { Form, Field } from "formik";
import type { FieldInputProps } from "formik";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { FormMessage } from "@/src/components/atoms/form-message";
import Link from "next/link";

const inputClassName =
  "w-full rounded-xl border border-white/10 bg-white/95 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] placeholder:text-slate-400";

interface LoginPresentationProps {
  useMagicLink: boolean;
  onToggleMagicLink: () => void;
  error: string;
  success: string;
  authError?: string | null;
  authSuccess?: string | null;
  isSubmitting: boolean;
}

export function LoginPresentation({
  useMagicLink,
  onToggleMagicLink,
  error,
  success,
  authError,
  authSuccess,
  isSubmitting,
}: LoginPresentationProps) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <Form ref={formRef} className="flex flex-col gap-5">
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-zinc-100"
        >
          Email
        </label>
        <Field name="email">
          {({ field }: { field: FieldInputProps<string> }) => (
            <InputText
              size="small"
              id="email"
              {...field}
              type="email"
              className={inputClassName}
              placeholder="you@example.com"
            />
          )}
        </Field>
        <p className="text-xs text-zinc-400 mt-2">
          {useMagicLink
            ? "We will send a secure sign-in link to this email."
            : "Use the email address linked to your account."}
        </p>
      </div>

      {!useMagicLink && (
        <div className="space-y-2">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-zinc-100"
          >
            Password
          </label>
          <Field name="password">
            {({ field }: { field: FieldInputProps<string> }) => (
              <Password
                size={"small" as never}
                id="password"
                {...field}
                feedback={false}
                toggleMask
                className="w-full"
                inputClassName={inputClassName}
                pt={{ iconField: { root: { className: "w-full" } } }}
                placeholder="Your password"
              />
            )}
          </Field>
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-400">
              Password visibility can be toggled from the eye icon.
            </p>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-cyan-300 transition-colors hover:text-cyan-200"
            >
              Forgot password?
            </Link>
          </div>
        </div>
      )}

      {authSuccess && (
        <FormMessage variant="success">{authSuccess}</FormMessage>
      )}
      {authError && <FormMessage variant="error">{authError}</FormMessage>}
      {error && <FormMessage variant="error">{error}</FormMessage>}
      {success && <FormMessage variant="success">{success}</FormMessage>}

      <Button
        size="small"
        type="submit"
        label={useMagicLink ? "Send magic link" : "Sign in"}
        loading={isSubmitting}
        className="mt-2 w-full justify-center rounded-xl border-0 bg-(image:--brand-gradient) px-4 py-3.5 text-base font-semibold text-white shadow-[0_18px_35px_rgba(41,184,255,0.32)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_45px_rgba(41,184,255,0.42)]"
        disabled={isSubmitting}
      />

      <Button
        size="small"
        outlined
        type="button"
        onClick={onToggleMagicLink}
        className="w-full rounded-xl px-4 py-2.5 justify-center text-sm font-medium text-cyan-200 transition-colors hover:bg-white/5 hover:text-cyan-100"
      >
        {useMagicLink
          ? "Sign in with password instead"
          : "Sign in with magic link instead"}
      </Button>
    </Form>
  );
}

export { inputClassName };
