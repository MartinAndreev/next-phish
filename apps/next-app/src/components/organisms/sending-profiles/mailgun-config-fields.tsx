"use client";

import { useTranslation } from "@/src/lib/i18n";
import { FormField } from "@/src/components/molecules/form-field";

export function MailgunConfigFields() {
  const t = useTranslation();

  return (
    <>
      <FormField
        name="providerConfig.apiKey"
        label={t("sendingProfiles.mailgunApiKey")}
        type="password"
        autoComplete="off"
      />
      <FormField
        name="providerConfig.domain"
        label={t("sendingProfiles.mailgunDomain")}
      />
    </>
  );
}
