"use client";

import { useMemo } from "react";
import {
  Form,
  Field,
  ErrorMessage,
  useFormikContext,
  type FieldInputProps,
} from "formik";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { MultiSelect } from "primereact/multiselect";
import { FormMessage } from "@/src/components/atoms/form-message";
import { useTranslation } from "@/src/lib/i18n";
import { selectSmall } from "@/src/components/ui/theme-constants";
import { PERMISSION_GROUPS, TIME_WINDOW_OPTIONS } from "@next-phish/shared";

interface Organization {
  id: string;
  name: string;
}

interface CreateApiKeyValues {
  name: string;
  limitToOrganizations: boolean;
  organizationIds: string[];
  permissions: Record<string, boolean>;
  expiresInDays: number | null;
  rateLimitEnabled: boolean;
  rateLimitMax: number | null;
  rateLimitTimeWindow: number | null;
}

interface CreateApiKeyPresentationProps {
  visible: boolean;
  onHide: () => void;
  error: string;
  organizations: Organization[];
}

export function ApiKeyForm({
  visible,
  onHide,
  error,
  organizations,
}: CreateApiKeyPresentationProps) {
  const t = useTranslation();
  const { values, setFieldValue, isSubmitting } =
    useFormikContext<CreateApiKeyValues>();

  const timeWindowOptions = useMemo(
    () =>
      TIME_WINDOW_OPTIONS.map((opt) => ({
        label: t(opt.translationKey),
        value: opt.value,
      })),
    [t],
  );

  const orgOptions = useMemo(
    () => organizations.map((org) => ({ label: org.name, value: org.id })),
    [organizations],
  );

  const expiresOptions = useMemo(
    () => [
      { label: t("apiKeys.neverExpires"), value: null },
      { label: `30 ${t("apiKeys.days")}`, value: 30 },
      { label: `60 ${t("apiKeys.days")}`, value: 60 },
      { label: `90 ${t("apiKeys.days")}`, value: 90 },
      { label: `365 ${t("apiKeys.days")}`, value: 365 },
    ],
    [t],
  );

  return (
    <Dialog
      header={t("apiKeys.createTitle")}
      visible={visible}
      onHide={onHide}
      style={{ width: "32rem" }}
      modal
    >
      <Form className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="api-key-name"
            className="mb-1 block text-sm font-medium text-zinc-300"
          >
            {t("apiKeys.name")}
          </label>
          <Field
            id="api-key-name"
            as={InputText}
            name="name"
            placeholder={t("apiKeys.namePlaceholder")}
            className="w-full"
            size="small"
          />
          <ErrorMessage
            name="name"
            component="p"
            className="mt-1 text-sm text-red-400"
          />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <Checkbox
              inputId="limitToOrganizations"
              checked={values.limitToOrganizations}
              onChange={() =>
                setFieldValue(
                  "limitToOrganizations",
                  !values.limitToOrganizations,
                )
              }
            />
            <label
              htmlFor="limitToOrganizations"
              className="text-sm font-medium text-zinc-300"
            >
              {t("apiKeys.limitToOrganizations")}
            </label>
          </div>
        </div>

        {values.limitToOrganizations && (
          <div>
            <label
              htmlFor="api-key-organizations"
              className="mb-1 block text-sm font-medium text-zinc-300"
            >
              {t("apiKeys.organizations")}
            </label>
            <MultiSelect
              inputId="api-key-organizations"
              pt={selectSmall}
              value={values.organizationIds}
              options={orgOptions}
              placeholder={t("apiKeys.selectOrganizations")}
              onChange={(e) => setFieldValue("organizationIds", e.value)}
              className="w-full"
              display="chip"
            />
          </div>
        )}

        <div>
          <p className="mb-2 text-sm font-medium text-zinc-300">
            {t("apiKeys.permissions")}
          </p>
          <div className="space-y-3 rounded-lg border border-white/10 bg-white/5 p-3">
            {PERMISSION_GROUPS.map((group) => (
              <div key={group.resource}>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  {group.resource}
                </p>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      inputId={`perm-${group.read}`}
                      checked={!!values.permissions[group.read]}
                      onChange={() =>
                        setFieldValue(
                          `permissions.${group.read}`,
                          !values.permissions[group.read],
                        )
                      }
                    />
                    <label
                      htmlFor={`perm-${group.read}`}
                      className="text-sm text-zinc-300"
                    >
                      read
                    </label>
                  </div>
                  {group.write && (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        inputId={`perm-${group.write}`}
                        checked={!!values.permissions[group.write]}
                        onChange={() => {
                          const writeKey = group.write!;
                          setFieldValue(
                            `permissions.${writeKey}`,
                            !values.permissions[writeKey],
                          );
                        }}
                      />
                      <label
                        htmlFor={`perm-${group.write}`}
                        className="text-sm text-zinc-300"
                      >
                        write
                      </label>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="api-key-expiration"
            className="mb-1 block text-sm font-medium text-zinc-300"
          >
            {t("apiKeys.expiration")}
          </label>
          <Dropdown
            inputId="api-key-expiration"
            pt={selectSmall}
            value={values.expiresInDays}
            options={expiresOptions}
            onChange={(e) => setFieldValue("expiresInDays", e.value)}
            className="w-full"
          />
        </div>

        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Checkbox
              inputId="rateLimitEnabled"
              checked={values.rateLimitEnabled}
              onChange={() =>
                setFieldValue("rateLimitEnabled", !values.rateLimitEnabled)
              }
            />
            <label
              htmlFor="rateLimitEnabled"
              className="text-sm font-medium text-zinc-300"
            >
              {t("apiKeys.rateLimit")}
            </label>
          </div>

          {values.rateLimitEnabled && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="api-key-rate-limit-max"
                  className="mb-1 block text-xs text-zinc-400"
                >
                  {t("apiKeys.maxRequests")}
                </label>
                <Field name="rateLimitMax">
                  {({ field }: { field: FieldInputProps<string> }) => (
                    <InputText
                      id="api-key-rate-limit-max"
                      size="small"
                      {...field}
                      className="w-full"
                    />
                  )}
                </Field>
              </div>
              <div>
                <label
                  htmlFor="api-key-rate-limit-window"
                  className="mb-1 block text-xs text-zinc-400"
                >
                  {t("apiKeys.timeWindow")}
                </label>
                <Dropdown
                  inputId="api-key-rate-limit-window"
                  pt={selectSmall}
                  value={values.rateLimitTimeWindow}
                  options={timeWindowOptions}
                  onChange={(e) =>
                    setFieldValue("rateLimitTimeWindow", e.value)
                  }
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>

        {error && <FormMessage variant="error">{error}</FormMessage>}

        <div className="mt-2 flex justify-end gap-2">
          <Button
            size="small"
            label={t("common.cancel")}
            severity="danger"
            outlined
            type="button"
            onClick={onHide}
          />
          <Button
            size="small"
            className="bg-(image:--brand-gradient)"
            label={t("apiKeys.create")}
            loading={isSubmitting}
            type="submit"
          />
        </div>
      </Form>
    </Dialog>
  );
}
