"use client";

import { Field } from "formik";
import { Checkbox } from "primereact/checkbox";
import { useTranslation } from "@/src/lib/i18n";
import { FormField } from "@/src/components/molecules/form-field";

export function SmtpConfigFields() {
  const t = useTranslation();

  return (
    <>
      <FormField
        name="providerConfig.host"
        label={t("sendingProfiles.smptHost")}
      />
      <FormField
        name="providerConfig.port"
        label={t("sendingProfiles.smtpPort")}
      />
      <FormField
        name="providerConfig.username"
        label={t("sendingProfiles.smtpUsername")}
        autoComplete="off"
      />
      <FormField
        name="providerConfig.password"
        label={t("sendingProfiles.smtpPassword")}
        type="password"
        autoComplete="off"
      />
      <div className="flex flex-wrap gap-6">
        <div className="flex items-center gap-2">
          <Field name="providerConfig.secure">
            {({
              field,
            }: {
              field: {
                value: string;
                onChange: (e: { checked: boolean }) => void;
                name: string;
              };
            }) => (
              <Checkbox
                checked={field.value === "true"}
                onChange={(e) =>
                  field.onChange({ checked: e.checked ?? false })
                }
                inputId={field.name}
                name={field.name}
              />
            )}
          </Field>
          <label
            htmlFor="providerConfig.secure"
            className="text-sm text-zinc-300"
          >
            {t("sendingProfiles.smtpSecure")}
          </label>
        </div>
        <div className="flex items-center gap-2">
          <Field name="providerConfig.requireTls">
            {({
              field,
            }: {
              field: {
                value: string;
                onChange: (e: { checked: boolean }) => void;
                name: string;
              };
            }) => (
              <Checkbox
                checked={field.value === "true"}
                onChange={(e) =>
                  field.onChange({ checked: e.checked ?? false })
                }
                inputId={field.name}
                name={field.name}
              />
            )}
          </Field>
          <label
            htmlFor="providerConfig.requireTls"
            className="text-sm text-zinc-300"
          >
            {t("sendingProfiles.smtpRequireTls")}
          </label>
        </div>
      </div>
    </>
  );
}
