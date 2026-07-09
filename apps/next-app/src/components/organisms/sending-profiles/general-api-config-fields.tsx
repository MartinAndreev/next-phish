"use client";

import { Field, ErrorMessage, useFormikContext } from "formik";
import { Dropdown } from "primereact/dropdown";
import { useTranslation } from "@/src/lib/i18n";
import { selectSmall } from "@/src/components/ui/theme-constants";
import { FormField } from "./form-field";

const errorCls = "mt-1 text-xs text-red-400";

type ProfileFormValues = {
  providerConfig: Record<string, string>;
};

export function GeneralApiConfigFields() {
  const t = useTranslation();
  const { values } = useFormikContext<ProfileFormValues>();
  const authMethod = values.providerConfig?.authMethod ?? "";

  const authMethodOptions = [
    { label: t("sendingProfiles.generalAuthBearer"), value: "bearer" },
    { label: t("sendingProfiles.generalAuthHeader"), value: "header" },
  ];

  return (
    <>
      <FormField
        name="providerConfig.apiKey"
        label={t("sendingProfiles.generalApiKey")}
        type="password"
        autoComplete="off"
      />
      <FormField
        name="providerConfig.sendEndpoint"
        label={t("sendingProfiles.generalSendEndpoint")}
        placeholder="https://api.example.com/send"
      />
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          {t("sendingProfiles.generalAuthMethod")}
        </label>
        <Field
          as={Dropdown}
          pt={selectSmall}
          name="providerConfig.authMethod"
          options={authMethodOptions}
          className="w-full"
        />
        <ErrorMessage
          name="providerConfig.authMethod"
          component="p"
          className={errorCls}
        />
      </div>
      {authMethod === "header" && (
        <FormField
          name="providerConfig.authHeaderName"
          label={t("sendingProfiles.generalAuthHeaderName")}
          placeholder="X-API-Key"
        />
      )}
    </>
  );
}
