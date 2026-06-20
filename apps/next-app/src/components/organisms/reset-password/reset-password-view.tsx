"use client";

import { useRef } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import type { FieldInputProps } from "formik";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import {
  FormMessage,
  errorClassName,
} from "@/src/components/atoms/form-message";
import { resetPasswordSchema } from "@next-phish/shared";
import { toFormikValidation } from "@/src/lib/to-formik-validation";
import Link from "next/link";

const inputClassName =
  "w-full rounded-xl border border-white/10 bg-white/95 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] placeholder:text-slate-400";

interface ResetPasswordValues {
  newPassword: string;
  confirmPassword: string;
}

interface ResetPasswordViewProps {
  error: string;
  onSubmit: (values: ResetPasswordValues) => Promise<void>;
}

export function ResetPasswordView({ error, onSubmit }: ResetPasswordViewProps) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <Formik<ResetPasswordValues>
      initialValues={{ newPassword: "", confirmPassword: "" }}
      validate={toFormikValidation(resetPasswordSchema)}
      onSubmit={onSubmit}
    >
      {({ isSubmitting, errors, touched, submitCount }) => (
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
                  size={"small" as never}
                  id="newPassword"
                  {...field}
                  feedback
                  toggleMask
                  invalid={Boolean(
                    errors.newPassword &&
                    (touched.newPassword || submitCount > 0),
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
                  size={"small" as never}
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
            <ErrorMessage
              name="confirmPassword"
              component="p"
              className={errorClassName}
            />
          </div>

          {error && <FormMessage variant="error">{error}</FormMessage>}

          <Button
            size="small"
            type="submit"
            label="Reset password"
            loading={isSubmitting}
            disabled={isSubmitting}
            className="mt-2 w-full justify-center rounded-xl border-0 bg-(image:--brand-gradient) px-4 py-3.5 text-base font-semibold text-white shadow-[0_18px_35px_rgba(41,184,255,0.32)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_45px_rgba(41,184,255,0.42)]"
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
      )}
    </Formik>
  );
}
