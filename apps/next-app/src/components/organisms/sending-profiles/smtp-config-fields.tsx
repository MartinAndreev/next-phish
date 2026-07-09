"use client";

import { Field, ErrorMessage } from "formik";
import { InputNumber } from "primereact/inputnumber";
import { Checkbox } from "primereact/checkbox";
import { useTranslation } from "@/src/lib/i18n";
import { FormField } from "./form-field";

const errorCls = "mt-1 text-xs text-red-400";

export function SmtpConfigFields() {
  const t = useTranslation();

  return (
    <>
      <FormField
        name="providerConfig.host"
        label={t("sendingProfiles.smptHost")}
      />
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          {t("sendingProfiles.smtpPort")}
        </label>
        <Field name="providerConfig.port">
          {({
            field,
          }: {
            field: {
              value: string;
              onChange: (e: { value: number | null }) => void;
              name: string;
            };
          }) => (
            <InputNumber
              value={field.value ? Number(field.value) : null}
              onValueChange={(e) => field.onChange({ value: e.value ?? null })}
              name={field.name}
              inputClassName="h-8 w-full !rounded-lg !border !border-white/10 !bg-brand-dark !text-white/80"
              className="w-full"
            />
          )}
        </Field>
        <ErrorMessage
          name="providerConfig.port"
          component="p"
          className={errorCls}
        />
      </div>
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
