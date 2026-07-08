"use client";

import { Field, useFormikContext } from "formik";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import { InputNumber } from "primereact/inputnumber";
import { InputSwitch } from "primereact/inputswitch";
import { FormMessage } from "@/src/components/atoms/form-message";
import { useTranslation } from "@/src/lib/i18n";
import { selectSmall } from "@/src/components/ui/theme-constants";

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

const AUTH_METHOD_OPTIONS = [
  { label: "sendingProfiles.generalAuthBearer", value: "bearer" },
  { label: "sendingProfiles.generalAuthHeader", value: "header" },
];

function configFieldName(field: string): string {
  return `providerConfig.${field}`;
}

function fieldLabel(t: (key: string) => string, i18nKey: string): string {
  return t(`sendingProfiles.${i18nKey}`);
}

function SmtpConfigFields({ t }: { t: (key: string) => string }) {
  return (
    <>
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          {fieldLabel(t, "smptHost")}
        </label>
        <Field
          as={InputText}
          name={configFieldName("host")}
          size="small"
          className="w-full"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          {fieldLabel(t, "smtpPort")}
        </label>
        <Field name={configFieldName("port")}>
          {({
            field,
          }: {
            field: {
              value: string;
              onChange: (e: { value: number | null }) => void;
              name: string;
            };
          }) => (
            <InputNumber
              value={field.value ? Number(field.value) : null}
              onValueChange={(e) => field.onChange({ value: e.value ?? null })}
              name={field.name}
              inputClassName="h-8 w-full !rounded-lg !border !border-white/10 !bg-brand-dark !text-white/80"
              className="w-full"
            />
          )}
        </Field>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          {fieldLabel(t, "smtpUsername")}
        </label>
        <Field
          as={InputText}
          name={configFieldName("username")}
          size="small"
          className="w-full"
          autoComplete="off"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          {fieldLabel(t, "smtpPassword")}
        </label>
        <Field
          as={InputText}
          name={configFieldName("password")}
          type="password"
          size="small"
          className="w-full"
          autoComplete="off"
        />
      </div>
      <div className="flex flex-wrap gap-6">
        <div className="flex items-center gap-2">
          <Field name={configFieldName("secure")}>
            {({
              field,
            }: {
              field: {
                value: string;
                onChange: (e: { checked: boolean }) => void;
                name: string;
              };
            }) => (
              <Checkbox
                checked={field.value === "true"}
                onChange={(e) =>
                  field.onChange({ checked: e.checked ?? false })
                }
                inputId={field.name}
                name={field.name}
              />
            )}
          </Field>
          <label
            htmlFor={configFieldName("secure")}
            className="text-sm text-zinc-300"
          >
            {fieldLabel(t, "smtpSecure")}
          </label>
        </div>
        <div className="flex items-center gap-2">
          <Field name={configFieldName("requireTls")}>
            {({
              field,
            }: {
              field: {
                value: string;
                onChange: (e: { checked: boolean }) => void;
                name: string;
              };
            }) => (
              <Checkbox
                checked={field.value === "true"}
                onChange={(e) =>
                  field.onChange({ checked: e.checked ?? false })
                }
                inputId={field.name}
                name={field.name}
              />
            )}
          </Field>
          <label
            htmlFor={configFieldName("requireTls")}
            className="text-sm text-zinc-300"
          >
            {fieldLabel(t, "smtpRequireTls")}
          </label>
        </div>
      </div>
    </>
  );
}

function MsGraphConfigFields({ t }: { t: (key: string) => string }) {
  return (
    <>
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          {fieldLabel(t, "graphTenantId")}
        </label>
        <Field
          as={InputText}
          name={configFieldName("tenantId")}
          size="small"
          className="w-full"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          {fieldLabel(t, "graphClientId")}
        </label>
        <Field
          as={InputText}
          name={configFieldName("clientId")}
          size="small"
          className="w-full"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          {fieldLabel(t, "graphClientSecret")}
        </label>
        <Field
          as={InputText}
          name={configFieldName("clientSecret")}
          type="password"
          size="small"
          className="w-full"
          autoComplete="off"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          {fieldLabel(t, "graphSenderMailbox")}
        </label>
        <Field
          as={InputText}
          name={configFieldName("senderMailbox")}
          size="small"
          className="w-full"
        />
      </div>
    </>
  );
}

function AwsSesConfigFields({ t }: { t: (key: string) => string }) {
  return (
    <>
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          {fieldLabel(t, "sesRegion")}
        </label>
        <Field
          as={InputText}
          name={configFieldName("region")}
          size="small"
          className="w-full"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          {fieldLabel(t, "sesAccessKeyId")}
        </label>
        <Field
          as={InputText}
          name={configFieldName("accessKeyId")}
          size="small"
          className="w-full"
          autoComplete="off"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          {fieldLabel(t, "sesSecretAccessKey")}
        </label>
        <Field
          as={InputText}
          name={configFieldName("secretAccessKey")}
          type="password"
          size="small"
          className="w-full"
          autoComplete="off"
        />
      </div>
    </>
  );
}

function SendGridConfigFields({ t }: { t: (key: string) => string }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-zinc-300">
        {fieldLabel(t, "sendgridApiKey")}
      </label>
      <Field
        as={InputText}
        name={configFieldName("apiKey")}
        type="password"
        size="small"
        className="w-full"
        autoComplete="off"
      />
    </div>
  );
}

function MailgunConfigFields({ t }: { t: (key: string) => string }) {
  return (
    <>
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          {fieldLabel(t, "mailgunApiKey")}
        </label>
        <Field
          as={InputText}
          name={configFieldName("apiKey")}
          type="password"
          size="small"
          className="w-full"
          autoComplete="off"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          {fieldLabel(t, "mailgunDomain")}
        </label>
        <Field
          as={InputText}
          name={configFieldName("domain")}
          size="small"
          className="w-full"
        />
      </div>
    </>
  );
}

function PostmarkConfigFields({ t }: { t: (key: string) => string }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-zinc-300">
        {fieldLabel(t, "postmarkApiKey")}
      </label>
      <Field
        as={InputText}
        name={configFieldName("apiKey")}
        type="password"
        size="small"
        className="w-full"
        autoComplete="off"
      />
    </div>
  );
}

function ResendConfigFields({ t }: { t: (key: string) => string }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-zinc-300">
        {fieldLabel(t, "resendApiKey")}
      </label>
      <Field
        as={InputText}
        name={configFieldName("apiKey")}
        type="password"
        size="small"
        className="w-full"
        autoComplete="off"
      />
    </div>
  );
}

function GeneralApiConfigFields({ t }: { t: (key: string) => string }) {
  const { values } = useFormikContext<ProfileFormValues>();
  const authMethod = values.providerConfig?.authMethod ?? "";

  return (
    <>
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          {fieldLabel(t, "generalApiKey")}
        </label>
        <Field
          as={InputText}
          name={configFieldName("apiKey")}
          type="password"
          size="small"
          className="w-full"
          autoComplete="off"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          {fieldLabel(t, "generalSendEndpoint")}
        </label>
        <Field
          as={InputText}
          name={configFieldName("sendEndpoint")}
          size="small"
          className="w-full"
          placeholder="https://api.example.com/send"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          {fieldLabel(t, "generalAuthMethod")}
        </label>
        <Field
          as={Dropdown}
          pt={selectSmall}
          name={configFieldName("authMethod")}
          options={AUTH_METHOD_OPTIONS}
          className="w-full"
        />
      </div>
      {authMethod === "header" && (
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-300">
            {fieldLabel(t, "generalAuthHeaderName")}
          </label>
          <Field
            as={InputText}
            name={configFieldName("authHeaderName")}
            size="small"
            className="w-full"
            placeholder="X-API-Key"
          />
        </div>
      )}
    </>
  );
}

function ProviderConfigFields({
  providerType,
  t,
}: {
  providerType: string;
  t: (key: string) => string;
}) {
  switch (providerType) {
    case "SMTP":
      return <SmtpConfigFields t={t} />;
    case "MICROSOFT_GRAPH":
      return <MsGraphConfigFields t={t} />;
    case "AWS_SES":
      return <AwsSesConfigFields t={t} />;
    case "SENDGRID":
      return <SendGridConfigFields t={t} />;
    case "MAILGUN":
      return <MailgunConfigFields t={t} />;
    case "POSTMARK":
      return <PostmarkConfigFields t={t} />;
    case "RESEND":
      return <ResendConfigFields t={t} />;
    case "GENERAL_API":
      return <GeneralApiConfigFields t={t} />;
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
            <ProviderConfigFields providerType={values.providerType} t={t} />
          </div>
        </div>
      )}

      {error && <FormMessage variant="error">{error}</FormMessage>}
    </div>
  );
}
