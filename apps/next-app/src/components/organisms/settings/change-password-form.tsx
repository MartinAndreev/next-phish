"use client";

import { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import type { FieldInputProps } from "formik";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { authClient } from "@/src/lib/auth-client";
import {
  FormMessage,
  errorClassName,
} from "@/src/components/atoms/form-message";

const inputClassName =
  "w-full rounded-xl border border-white/10 bg-white/95 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] placeholder:text-slate-400";

interface PasswordValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function ChangePasswordForm() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(values: PasswordValues) {
    setError("");
    setSuccess("");

    if (values.newPassword !== values.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const { error: err } = await authClient.changePassword({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
      revokeOtherSessions: true,
    });

    if (err) {
      setError(err.message || err.code || "Failed to change password");
      return;
    }

    setSuccess("Password changed successfully");
  }

  return (
    <Formik<PasswordValues>
      initialValues={{
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }}
      onSubmit={handleSubmit}
    >
      {({ isSubmitting, errors, touched, submitCount }) => (
        <Form className="flex flex-col gap-5">
          <div className="space-y-2">
            <label
              htmlFor="currentPassword"
              className="block text-sm font-medium text-zinc-100"
            >
              Current password
            </label>
            <Field name="currentPassword">
              {({ field }: { field: FieldInputProps<string> }) => (
                <Password
                  id="currentPassword"
                  {...field}
                  toggleMask
                  feedback={false}
                  invalid={Boolean(
                    errors.currentPassword &&
                    (touched.currentPassword || submitCount > 0),
                  )}
                  className="w-full"
                  inputClassName={inputClassName}
                  pt={{ iconField: { root: { className: "w-full" } } }}
                  placeholder="Enter current password"
                />
              )}
            </Field>
            <ErrorMessage
              name="currentPassword"
              component="p"
              className={errorClassName}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                Confirm password
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
                    placeholder="Repeat new password"
                  />
                )}
              </Field>
              <ErrorMessage
                name="confirmPassword"
                component="p"
                className={errorClassName}
              />
            </div>
          </div>

          {error && <FormMessage variant="error">{error}</FormMessage>}
          {success && <FormMessage variant="success">{success}</FormMessage>}

          <Button
            type="submit"
            label="Change password"
            loading={isSubmitting}
            disabled={isSubmitting}
            className="mt-2 w-fit rounded-xl border-0 bg-[var(--brand-gradient)] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(41,184,255,0.25)] transition-transform duration-200 hover:-translate-y-0.5"
          />
        </Form>
      )}
    </Formik>
  );
}
