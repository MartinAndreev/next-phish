"use client";

import { useTranslation } from "@/src/lib/i18n";
import { FormField } from "./form-field";

export function AwsSesConfigFields() {
  const t = useTranslation();

  return (
    <>
      <FormField
        name="providerConfig.region"
        label={t("sendingProfiles.sesRegion")}
      />
      <FormField
        name="providerConfig.accessKeyId"
        label={t("sendingProfiles.sesAccessKeyId")}
        autoComplete="off"
      />
      <FormField
        name="providerConfig.secretAccessKey"
        label={t("sendingProfiles.sesSecretAccessKey")}
        type="password"
        autoComplete="off"
      />
    </>
  );
}
