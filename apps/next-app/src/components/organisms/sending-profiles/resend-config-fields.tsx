"use client";

import { useTranslation } from "@/src/lib/i18n";
import { FormField } from "@/src/components/molecules/form-field";

export function ResendConfigFields() {
  const t = useTranslation();

  return (
    <FormField
      name="providerConfig.apiKey"
      label={t("sendingProfiles.resendApiKey")}
      type="password"
      autoComplete="off"
    />
  );
}
