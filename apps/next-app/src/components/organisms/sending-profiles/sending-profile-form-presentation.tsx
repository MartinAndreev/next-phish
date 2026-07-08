"use client";

import { Field, useFormikContext } from "formik";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { InputSwitch } from "primereact/inputswitch";
import { FormMessage } from "@/src/components/atoms/form-message";
import { useTranslation } from "@/src/lib/i18n";
import { selectSmall } from "@/src/components/ui/theme-constants";
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

const PROVIDER_OPTIONS = [
  { label: "SMTP", value: "SMTP" },
  { label: "Microsoft Graph", value: "MICROSOFT_GRAPH" },
  { label: "AWS SES", value: "AWS_SES" },
  { label: "SendGrid", value: "SENDGRID" },
  { label: "Mailgun", value: "MAILGUN" },
  { label: "Postmark", value: "POSTMARK" },
  { label: "Resend", value: "RESEND" },
  { label: "General API", value: "GENERAL_API" },
];

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
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-300">
            {t("sendingProfiles.name")}
          </label>
          <Field
            as={InputText}
            name="name"
            size="small"
            placeholder={t("sendingProfiles.namePlaceholder")}
            className="w-full"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-300">
            {t("sendingProfiles.providerType")}
          </label>
          <Field
            as={Dropdown}
            pt={selectSmall}
            name="providerType"
            options={PROVIDER_OPTIONS}
            className="w-full"
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 md:grid md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-300">
            {t("sendingProfiles.fromName")}
          </label>
          <Field
            as={InputText}
            name="fromName"
            size="small"
            placeholder={t("sendingProfiles.fromNamePlaceholder")}
            className="w-full"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-300">
            {t("sendingProfiles.fromEmail")}
          </label>
          <Field
            as={InputText}
            name="fromEmail"
            size="small"
            placeholder={t("sendingProfiles.fromEmailPlaceholder")}
            className="w-full"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          {t("sendingProfiles.replyToEmail")}
        </label>
        <Field
          as={InputText}
          name="replyToEmail"
          size="small"
          placeholder={t("sendingProfiles.replyToEmailPlaceholder")}
          className="w-full"
        />
      </div>

      <div className="flex items-center gap-2">
        <Field name="isDefault">
          {({
            field,
          }: {
            field: {
              value: boolean;
              onChange: (e: { checked: boolean }) => void;
              name: string;
            };
          }) => (
            <InputSwitch
              checked={field.value}
              onChange={(e) => field.onChange({ checked: e.value })}
              inputId={field.name}
            />
          )}
        </Field>
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
