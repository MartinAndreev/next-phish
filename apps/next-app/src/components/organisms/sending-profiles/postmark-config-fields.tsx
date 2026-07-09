"use client";

import { useTranslation } from "@/src/lib/i18n";
import { FormField } from "./form-field";

export function PostmarkConfigFields() {
  const t = useTranslation();

  return (
    <FormField
      name="providerConfig.apiKey"
      label={t("sendingProfiles.postmarkApiKey")}
      type="password"
      autoComplete="off"
    />
  );
}
