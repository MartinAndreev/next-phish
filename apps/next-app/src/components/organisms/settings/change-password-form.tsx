"use client";

import { Formik, Form, Field, ErrorMessage } from "formik";
import type { FieldInputProps } from "formik";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { authClient } from "@/src/lib/auth-client";
import { changePasswordSchema } from "@next-phish/shared";
import { toFormikValidation } from "@/src/lib/to-formik-validation";
import { FormMessage } from "@/src/components/atoms/form-message";
import { errorClassName } from "@/src/components/atoms/form-message.styles";
import { useFormStatus } from "@/src/hooks/use-form-status";
import { useTranslation } from "@/src/lib/i18n";

const inputClassName =
  "w-full rounded-xl border border-white/10 bg-white/95 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] placeholder:text-slate-400";

interface PasswordValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function ChangePasswordForm() {
  const t = useTranslation();
  const { status, setError, setSuccess, reset } = useFormStatus();

  async function handleSubmit(values: PasswordValues) {
    reset();

    const { error: err } = await authClient.changePassword({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
      revokeOtherSessions: true,
    });

    if (err) {
      setError(err.message || err.code || t("settings.failedToChangePassword"));
      return;
    }

    setSuccess(t("settings.passwordChanged"));
  }

  return (
    <Formik<PasswordValues>
      initialValues={{
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }}
      validate={toFormikValidation(changePasswordSchema)}
      onSubmit={handleSubmit}
    >
      {({ isSubmitting, errors, touched, submitCount }) => (
        <Form className="flex flex-col gap-5">
          <div className="space-y-2">
            <label
              htmlFor="currentPassword"
              className="block text-sm font-medium text-zinc-100"
            >
              {t("settings.currentPassword")}
            </label>
            <Field name="currentPassword">
              {({ field }: { field: FieldInputProps<string> }) => (
                <Password
                  size={"small" as never}
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
                  placeholder={t("settings.enterCurrentPassword")}
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
                {t("resetPassword.newPassword")}
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
                    placeholder={t("settings.atLeastEightCharacters")}
                    promptLabel={t("settings.passwordStrengthPrompt")}
                    weakLabel={t("settings.weak")}
                    mediumLabel={t("settings.good")}
                    strongLabel={t("settings.strong")}
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
                {t("settings.confirmPassword")}
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
                    placeholder={t("settings.repeatNewPassword")}
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

          {status.type === "error" && (
            <FormMessage variant="error">{status.message}</FormMessage>
          )}
          {status.type === "success" && (
            <FormMessage variant="success">{status.message}</FormMessage>
          )}

          <Button
            size="small"
            type="submit"
            label={t("settings.changePasswordAction")}
            loading={isSubmitting}
            disabled={isSubmitting}
            className="mt-2 w-fit rounded-xl border-0 bg-(image:--brand-gradient) px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(41,184,255,0.25)] transition-transform duration-200 hover:-translate-y-0.5"
          />
        </Form>
      )}
    </Formik>
  );
}
