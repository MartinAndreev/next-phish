"use client";

import { Field } from "formik";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Checkbox } from "primereact/checkbox";
import { useTranslation } from "@/src/lib/i18n";

export function SmtpConfigFields() {
  const t = useTranslation();

  return (
    <>
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          {t("sendingProfiles.smptHost")}
        </label>
        <Field
          as={InputText}
          name="providerConfig.host"
          size="small"
          className="w-full"
        />
      </div>
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
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          {t("sendingProfiles.smtpUsername")}
        </label>
        <Field
          as={InputText}
          name="providerConfig.username"
          size="small"
          className="w-full"
          autoComplete="off"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          {t("sendingProfiles.smtpPassword")}
        </label>
        <Field
          as={InputText}
          name="providerConfig.password"
          type="password"
          size="small"
          className="w-full"
          autoComplete="off"
        />
      </div>
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
