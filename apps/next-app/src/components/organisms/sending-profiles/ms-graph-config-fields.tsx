"use client";

import { Field } from "formik";
import { InputText } from "primereact/inputtext";
import { useTranslation } from "@/src/lib/i18n";

export function MsGraphConfigFields() {
  const t = useTranslation();

  return (
    <>
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          {t("sendingProfiles.graphTenantId")}
        </label>
        <Field
          as={InputText}
          name="providerConfig.tenantId"
          size="small"
          className="w-full"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          {t("sendingProfiles.graphClientId")}
        </label>
        <Field
          as={InputText}
          name="providerConfig.clientId"
          size="small"
          className="w-full"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          {t("sendingProfiles.graphClientSecret")}
        </label>
        <Field
          as={InputText}
          name="providerConfig.clientSecret"
          type="password"
          size="small"
          className="w-full"
          autoComplete="off"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          {t("sendingProfiles.graphSenderMailbox")}
        </label>
        <Field
          as={InputText}
          name="providerConfig.senderMailbox"
          size="small"
          className="w-full"
        />
      </div>
    </>
  );
}
