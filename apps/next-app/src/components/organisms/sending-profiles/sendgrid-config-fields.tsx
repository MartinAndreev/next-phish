"use client";

import { useTranslation } from "@/src/lib/i18n";
import { FormField } from "./form-field";

export function SendGridConfigFields() {
  const t = useTranslation();

  return (
    <FormField
      name="providerConfig.apiKey"
      label={t("sendingProfiles.sendgridApiKey")}
      type="password"
      autoComplete="off"
    />
  );
}
