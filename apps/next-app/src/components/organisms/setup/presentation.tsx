"use client";

import { useRef } from "react";
import { Form, Field, ErrorMessage, useFormikContext } from "formik";
import type { FieldInputProps } from "formik";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { FormField } from "@/src/components/molecules/form-field";
import { FormMessage } from "@/src/components/atoms/form-message";
import { errorClassName } from "@/src/components/atoms/form-message.styles";
import { useTranslation } from "@/src/lib/i18n";

const inputClassName =
  "w-full rounded-xl border border-white/10 bg-white/95 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] placeholder:text-slate-400";

interface SetupPresentationProps {
  error: string;
}

interface SetupValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export function SetupPresentation({ error }: SetupPresentationProps) {
  const t = useTranslation();
  const formRef = useRef<HTMLFormElement>(null);
  const { errors, touched, submitCount, isSubmitting } =
    useFormikContext<SetupValues>();

  return (
    <Form ref={formRef} className="flex flex-col gap-5">
      <div className="space-y-2">
        <FormField
          name="name"
          label={t("common.name")}
          placeholder="Admin"
          inputClassName={inputClassName}
        />
        <p className="text-xs text-zinc-400 mt-2">{t("setup.nameHint")}</p>
      </div>

      <div className="space-y-2">
        <FormField
          name="email"
          label={t("common.email")}
          type="email"
          placeholder="admin@example.com"
          inputClassName={inputClassName}
        />
        <p className="text-xs text-zinc-400 mt-2">{t("setup.emailHint")}</p>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-2">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-zinc-100"
          >
            {t("common.password")}
          </label>
          <Field name="password">
            {({ field }: { field: FieldInputProps<string> }) => (
              <Password
                size={"small" as never}
                id="password"
                {...field}
                feedback
                toggleMask
                invalid={Boolean(
                  errors.password && (touched.password || submitCount > 0),
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
          <p className="text-xs text-zinc-400">{t("setup.passwordHint")}</p>
          <ErrorMessage
            name="password"
            component="p"
            className={errorClassName}
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-zinc-100"
          >
            {t("setup.confirmPassword")}
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
                placeholder={t("setup.confirmPassword")}
              />
            )}
          </Field>
          <p className="text-xs text-zinc-400">
            {t("setup.confirmPasswordHint")}
          </p>
          <ErrorMessage
            name="confirmPassword"
            component="p"
            className={errorClassName}
          />
        </div>
      </div>

      {error && <FormMessage variant="error">{error}</FormMessage>}

      <Button
        size="small"
        type="submit"
        label={t("setup.createAccount")}
        loading={isSubmitting}
        className="mt-2 w-full justify-center rounded-xl border-0 bg-(image:--brand-gradient) px-4 py-3.5 text-base font-semibold text-white shadow-[0_18px_35px_rgba(41,184,255,0.32)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_45px_rgba(41,184,255,0.42)]"
        disabled={isSubmitting}
      />
    </Form>
  );
}
