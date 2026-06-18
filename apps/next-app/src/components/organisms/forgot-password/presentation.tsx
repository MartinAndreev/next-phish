"use client";

import { useRef } from "react";
import { Form, Field } from "formik";
import type { FieldInputProps } from "formik";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { FormMessage } from "@/src/components/atoms/form-message";
import Link from "next/link";

const inputClassName =
  "w-full rounded-xl border border-white/10 bg-white/95 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] placeholder:text-slate-400";

interface ForgotPasswordPresentationProps {
  error: string;
  success: string;
  isSubmitting: boolean;
}

export function ForgotPasswordPresentation({
  error,
  success,
  isSubmitting,
}: ForgotPasswordPresentationProps) {
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
              id="email"
              {...field}
              type="email"
              className={inputClassName}
              placeholder="you@example.com"
            />
          )}
        </Field>
        <p className="text-xs text-zinc-400 mt-2">
          Enter the email address linked to your account and we will send you a
          link to reset your password.
        </p>
      </div>

      {error && <FormMessage variant="error">{error}</FormMessage>}
      {success && <FormMessage variant="success">{success}</FormMessage>}

      <Button
        type="submit"
        label="Send reset link"
        loading={isSubmitting}
        className="mt-2 w-full justify-center rounded-xl border-0 bg-[var(--brand-gradient)] px-4 py-3.5 text-base font-semibold text-white shadow-[0_18px_35px_rgba(41,184,255,0.32)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_45px_rgba(41,184,255,0.42)]"
        disabled={isSubmitting}
      />

      <p className="text-center text-sm text-zinc-400">
        Remember your password?{" "}
        <Link
          href="/login"
          className="font-medium text-cyan-300 transition-colors hover:text-cyan-200"
        >
          Sign in
        </Link>
      </p>
    </Form>
  );
}
