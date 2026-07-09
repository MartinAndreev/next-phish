"use client";

import { useTranslation } from "@/src/lib/i18n";
import { FormField } from "@/src/components/molecules/form-field";

export function MsGraphConfigFields() {
  const t = useTranslation();

  return (
    <>
      <FormField
        name="providerConfig.tenantId"
        label={t("sendingProfiles.graphTenantId")}
      />
      <FormField
        name="providerConfig.clientId"
        label={t("sendingProfiles.graphClientId")}
      />
      <FormField
        name="providerConfig.clientSecret"
        label={t("sendingProfiles.graphClientSecret")}
        type="password"
        autoComplete="off"
      />
      <FormField
        name="providerConfig.senderMailbox"
        label={t("sendingProfiles.graphSenderMailbox")}
      />
    </>
  );
}
