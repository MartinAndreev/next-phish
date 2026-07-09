"use client";

import { Field, useFormikContext } from "formik";
import { Dropdown } from "primereact/dropdown";
import { InputSwitch } from "primereact/inputswitch";
import { FormMessage } from "@/src/components/atoms/form-message";
import { useTranslation } from "@/src/lib/i18n";
import { MAIL_PROVIDER_TYPES } from "@next-phish/shared";
import { selectSmall } from "@/src/components/ui/theme-constants";
import { FormField } from "@/src/components/molecules/form-field";
import { SmtpConfigFields } from "./smtp-config-fields";
import { MsGraphConfigFields } from "./ms-graph-config-fields";
import { AwsSesConfigFields } from "./aws-ses-config-fields";
import { SendGridConfigFields } from "./sendgrid-config-fields";
import { MailgunConfigFields } from "./mailgun-config-fields";
import { PostmarkConfigFields } from "./postmark-config-fields";
import { ResendConfigFields } from "./resend-config-fields";
import { GeneralApiConfigFields } from "./general-api-config-fields";

interface SendingProfileFormPresentationProps {
  error: string;
  isEdit: boolean;
}

type ProfileFormValues = {
  name: string;
  providerType: string;
  fromName: string;
  fromEmail: string;
  replyToEmail: string;
  isDefault: boolean;
  providerConfig: Record<string, string>;
};

const PROVIDER_OPTIONS = MAIL_PROVIDER_TYPES.map((value) => ({
  label: value,
  value,
}));

function ProviderConfigFields({ providerType }: { providerType: string }) {
  switch (providerType) {
    case "SMTP":
      return <SmtpConfigFields />;
    case "MICROSOFT_GRAPH":
      return <MsGraphConfigFields />;
    case "AWS_SES":
      return <AwsSesConfigFields />;
    case "SENDGRID":
      return <SendGridConfigFields />;
    case "MAILGUN":
      return <MailgunConfigFields />;
    case "POSTMARK":
      return <PostmarkConfigFields />;
    case "RESEND":
      return <ResendConfigFields />;
    case "GENERAL_API":
      return <GeneralApiConfigFields />;
    default:
      return null;
  }
}

export function SendingProfileFormPresentation({
  error,
}: SendingProfileFormPresentationProps) {
  const t = useTranslation();
  const { values } = useFormikContext<ProfileFormValues>();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:grid md:grid-cols-2">
        <FormField
          name="name"
          label={t("sendingProfiles.name")}
          placeholder={t("sendingProfiles.namePlaceholder")}
        />

        <div>
          <label
            htmlFor="providerType"
            className="mb-2 block text-sm font-medium text-zinc-300"
          >
            {t("sendingProfiles.providerType")}
          </label>
          <Field
            as={Dropdown}
            pt={selectSmall}
            name="providerType"
            inputId="providerType"
            options={PROVIDER_OPTIONS}
            className="w-full"
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 md:grid md:grid-cols-2">
        <FormField
          name="fromName"
          label={t("sendingProfiles.fromName")}
          placeholder={t("sendingProfiles.fromNamePlaceholder")}
        />
        <FormField
          name="fromEmail"
          label={t("sendingProfiles.fromEmail")}
          placeholder={t("sendingProfiles.fromEmailPlaceholder")}
        />
      </div>

      <FormField
        name="replyToEmail"
        label={t("sendingProfiles.replyToEmail")}
        placeholder={t("sendingProfiles.replyToEmailPlaceholder")}
      />

      <div className="flex items-center gap-2">
        <Field name="isDefault" as={InputSwitch} type="checkbox" />
        <label htmlFor="isDefault" className="text-sm text-zinc-300">
          {t("sendingProfiles.isDefault")}
        </label>
      </div>

      {values.providerType && (
        <div className="rounded-xl border border-[#1C2945] bg-brand-navy/50 p-5">
          <h2 className="mb-4 text-base font-medium text-white">
            {t("sendingProfiles.providerConfig")}
          </h2>
          <div className="flex flex-col gap-4">
            <ProviderConfigFields providerType={values.providerType} />
          </div>
        </div>
      )}

      {error && <FormMessage variant="error">{error}</FormMessage>}
    </div>
  );
}
