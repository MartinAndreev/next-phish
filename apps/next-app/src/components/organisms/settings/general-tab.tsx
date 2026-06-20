"use client";

import { Formik, Form, Field, ErrorMessage } from "formik";
import type { FieldInputProps } from "formik";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { authClient } from "@/src/lib/auth-client";
import { updateProfileSchema } from "@next-phish/shared";
import { toFormikValidation } from "@/src/lib/to-formik-validation";
import { SUPPORTED_LANGUAGES } from "@/src/lib/constants";
import { FormMessage } from "@/src/components/atoms/form-message";
import { errorClassName } from "@/src/components/atoms/form-message.styles";
import { useFormStatus } from "@/src/hooks/use-form-status";
import { selectSmall } from "@/src/components/ui/theme-constants";
import { useRouter } from "next/navigation";
import { type Locale, useSetLocale, useTranslation } from "@/src/lib/i18n";

const inputClassName =
  "w-full rounded-xl border border-white/10 bg-white/95 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] placeholder:text-slate-400";

interface GeneralTabProps {
  user: {
    id: string;
    name: string;
    email: string;
    timezone?: string | null;
    language?: string | null;
  };
}

function getTimezones(): string[] {
  try {
    return Intl.supportedValuesOf("timeZone");
  } catch {
    return ["UTC"];
  }
}

const timezones = getTimezones();

interface GeneralValues {
  name: string;
  timezone: string;
  language: string;
}

export function GeneralTab({ user }: GeneralTabProps) {
  const t = useTranslation();
  const setLocale = useSetLocale();
  const router = useRouter();
  const { status, setError, setSuccess, reset } = useFormStatus();

  async function handleSubmit(values: GeneralValues) {
    reset();

    const { error: err } = await authClient.updateUser({
      name: values.name,
      timezone: values.timezone,
      language: values.language,
    } as Parameters<typeof authClient.updateUser>[0]);

    if (err) {
      setError(err.message || err.code || t("settings.failedToUpdateProfile"));
      return;
    }

    setLocale(values.language as Locale);
    router.refresh();
    setSuccess(t("settings.profileUpdated"));
  }

  return (
    <Formik<GeneralValues>
      initialValues={{
        name: user.name,
        timezone: user.timezone || "UTC",
        language: user.language || "en",
      }}
      validate={toFormikValidation(updateProfileSchema)}
      onSubmit={handleSubmit}
    >
      {({ isSubmitting, setFieldValue, values }) => (
        <Form className="flex flex-col gap-5 max-w-lg">
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-zinc-100"
            >
              {t("common.name")}
            </label>
            <Field name="name">
              {({ field }: { field: FieldInputProps<string> }) => (
                <InputText
                  size="small"
                  id="name"
                  {...field}
                  className={inputClassName}
                  placeholder="Your name"
                />
              )}
            </Field>
            <ErrorMessage
              name="name"
              component="p"
              className={errorClassName}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-zinc-100"
            >
              {t("common.email")}
            </label>
            <InputText
              size="small"
              id="email"
              value={user.email}
              disabled
              className={`${inputClassName} opacity-60`}
            />
            <p className="text-xs text-zinc-400 mt-2">
              {t("settings.emailReadonly")}
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="timezone"
              className="block text-sm font-medium text-zinc-100"
            >
              {t("settings.timezone")}
            </label>
            <Dropdown
              pt={selectSmall}
              id="timezone"
              size={"small" as never}
              value={values.timezone}
              options={timezones.map((tz) => ({ label: tz, value: tz }))}
              onChange={(e) => setFieldValue("timezone", e.value)}
              filter
              placeholder={t("settings.selectTimezone")}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="language"
              className="block text-sm font-medium text-zinc-100"
            >
              {t("settings.language")}
            </label>
            <Dropdown
              pt={selectSmall}
              size={"small" as never}
              id="language"
              value={values.language}
              options={SUPPORTED_LANGUAGES}
              onChange={(e) => setFieldValue("language", e.value)}
              placeholder={t("settings.selectLanguage")}
              className="w-full"
            />
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
            label={t("common.saveChanges")}
            loading={isSubmitting}
            disabled={isSubmitting}
            className="mt-2 w-fit rounded-xl border-0 bg-(image:--brand-gradient) px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(41,184,255,0.25)] transition-transform duration-200 hover:-translate-y-0.5"
          />
        </Form>
      )}
    </Formik>
  );
}
