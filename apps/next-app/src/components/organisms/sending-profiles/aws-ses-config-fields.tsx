"use client";

import { Field } from "formik";
import { InputText } from "primereact/inputtext";
import { useTranslation } from "@/src/lib/i18n";

export function AwsSesConfigFields() {
  const t = useTranslation();

  return (
    <>
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          {t("sendingProfiles.sesRegion")}
        </label>
        <Field
          as={InputText}
          name="providerConfig.region"
          size="small"
          className="w-full"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          {t("sendingProfiles.sesAccessKeyId")}
        </label>
        <Field
          as={InputText}
          name="providerConfig.accessKeyId"
          size="small"
          className="w-full"
          autoComplete="off"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          {t("sendingProfiles.sesSecretAccessKey")}
        </label>
        <Field
          as={InputText}
          name="providerConfig.secretAccessKey"
          type="password"
          size="small"
          className="w-full"
          autoComplete="off"
        />
      </div>
    </>
  );
}
