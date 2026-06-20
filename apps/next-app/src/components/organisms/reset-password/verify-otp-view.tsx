"use client";

import { useRef } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import type { FieldInputProps } from "formik";
import { InputOtp } from "primereact/inputotp";
import { Button } from "primereact/button";
import { FormMessage } from "@/src/components/atoms/form-message";
import { errorClassName } from "@/src/components/atoms/form-message.styles";
import { verifyOtpSchema } from "@next-phish/shared";
import { toFormikValidation } from "@/src/lib/to-formik-validation";
import Link from "next/link";
import { useTranslation } from "@/src/lib/i18n";

interface VerifyOtpValues {
  otp: string;
}

interface VerifyOtpViewProps {
  email: string;
  error: string;
  onSubmit: (values: VerifyOtpValues) => Promise<void>;
}

export function VerifyOtpView({ email, error, onSubmit }: VerifyOtpViewProps) {
  const t = useTranslation();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <Formik<VerifyOtpValues>
      initialValues={{ otp: "" }}
      validate={toFormikValidation(verifyOtpSchema.omit({ email: true }))}
      onSubmit={onSubmit}
    >
      {({ isSubmitting, setFieldValue }) => (
        <Form ref={formRef} className="flex flex-col gap-5">
          <p className="text-sm text-zinc-400">
            {t("resetPassword.verifyIntro", { email })}
          </p>

          <div className="space-y-2">
            <Field name="otp">
              {({ field }: { field: FieldInputProps<string> }) => (
                <div className="flex justify-center">
                  <InputOtp
                    value={field.value}
                    onChange={(e) =>
                      setFieldValue("otp", e.value?.toString() || "")
                    }
                    length={6}
                    integerOnly
                  />
                </div>
              )}
            </Field>
            <ErrorMessage name="otp" component="p" className={errorClassName} />
          </div>

          {error && <FormMessage variant="error">{error}</FormMessage>}

          <Button
            size="small"
            type="submit"
            label={t("resetPassword.verifyCode")}
            loading={isSubmitting}
            disabled={isSubmitting}
            className="mt-2 w-full justify-center rounded-xl border-0 bg-(image:--brand-gradient) px-4 py-3.5 text-base font-semibold text-white shadow-[0_18px_35px_rgba(41,184,255,0.32)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_45px_rgba(41,184,255,0.42)]"
          />

          <p className="text-center text-sm text-zinc-400">
            {t("forgotPassword.rememberPassword")}{" "}
            <Link
              href="/login"
              className="font-medium text-cyan-300 transition-colors hover:text-cyan-200"
            >
              {t("common.signIn")}
            </Link>
          </p>
        </Form>
      )}
    </Formik>
  );
}
