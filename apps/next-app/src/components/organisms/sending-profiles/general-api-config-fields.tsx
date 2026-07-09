"use client";

import { Field, useFormikContext } from "formik";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { useTranslation } from "@/src/lib/i18n";
import { selectSmall } from "@/src/components/ui/theme-constants";

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
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          {t("sendingProfiles.generalApiKey")}
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
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          {t("sendingProfiles.generalSendEndpoint")}
        </label>
        <Field
          as={InputText}
          name="providerConfig.sendEndpoint"
          size="small"
          className="w-full"
          placeholder="https://api.example.com/send"
        />
      </div>
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
      </div>
      {authMethod === "header" && (
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-300">
            {t("sendingProfiles.generalAuthHeaderName")}
          </label>
          <Field
            as={InputText}
            name="providerConfig.authHeaderName"
            size="small"
            className="w-full"
            placeholder="X-API-Key"
          />
        </div>
      )}
    </>
  );
}
