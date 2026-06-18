"use client";

import { useRef } from "react";
import { Form, Field, ErrorMessage, useFormikContext } from "formik";
import type { FieldInputProps } from "formik";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import {
  FormMessage,
  errorClassName,
} from "@/src/components/atoms/form-message";
import Link from "next/link";

const inputClassName =
  "w-full rounded-xl border border-white/10 bg-white/95 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] placeholder:text-slate-400";

interface ResetPasswordPresentationProps {
  error: string;
  isSubmitting: boolean;
}

interface ResetPasswordValues {
  newPassword: string;
  confirmPassword: string;
}

export function ResetPasswordPresentation({
  error,
  isSubmitting,
}: ResetPasswordPresentationProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const { errors, touched, submitCount } =
    useFormikContext<ResetPasswordValues>();

  return (
    <Form ref={formRef} className="flex flex-col gap-5">
      <div className="space-y-2">
        <label
          htmlFor="newPassword"
          className="block text-sm font-medium text-zinc-100"
        >
          New password
        </label>
        <Field name="newPassword">
          {({ field }: { field: FieldInputProps<string> }) => (
            <Password
              id="newPassword"
              {...field}
              feedback
              toggleMask
              invalid={Boolean(
                errors.newPassword && (touched.newPassword || submitCount > 0),
              )}
              className="w-full"
              inputClassName={inputClassName}
              pt={{ iconField: { root: { className: "w-full" } } }}
              panelClassName="rounded-2xl border border-white/10 bg-slate-950/95 shadow-2xl backdrop-blur"
              placeholder="At least 8 characters"
              promptLabel="Use a strong password"
              weakLabel="Weak"
              mediumLabel="Good"
              strongLabel="Strong"
            />
          )}
        </Field>
        <p className="text-xs text-zinc-400">
          Use at least 8 characters with a mix of letters and numbers.
        </p>
        <ErrorMessage
          name="newPassword"
          component="p"
          className={errorClassName}
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-zinc-100"
        >
          Confirm new password
        </label>
        <Field name="confirmPassword">
          {({ field }: { field: FieldInputProps<string> }) => (
            <Password
              id="confirmPassword"
              {...field}
              toggleMask
              feedback={false}
              invalid={Boolean(
                errors.confirmPassword &&
                (touched.confirmPassword || submitCount > 0),
              )}
              className="w-full"
              inputClassName={inputClassName}
              pt={{ iconField: { root: { className: "w-full" } } }}
              placeholder="Repeat your new password"
            />
          )}
        </Field>
        <p className="text-xs text-zinc-400">
          Repeat the password exactly to avoid lockouts.
        </p>
        <ErrorMessage
          name="confirmPassword"
          component="p"
          className={errorClassName}
        />
      </div>

      {error && <FormMessage variant="error">{error}</FormMessage>}

      <Button
        type="submit"
        label="Reset password"
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
