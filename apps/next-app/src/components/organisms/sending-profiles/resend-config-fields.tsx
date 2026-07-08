"use client";

import { Field } from "formik";
import { InputText } from "primereact/inputtext";
import { useTranslation } from "@/src/lib/i18n";

export function ResendConfigFields() {
  const t = useTranslation();

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-zinc-300">
        {t("sendingProfiles.resendApiKey")}
      </label>
      <Field
        as={InputText}
        name="providerConfig.apiKey"
        type="password"
        size="small"
        className="w-full"
        autoComplete="off"
      />
    </div>
  );
}
