"use client";

import { useMemo } from "react";
import { Form, Field, ErrorMessage, useFormikContext } from "formik";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { MultiSelect } from "primereact/multiselect";
import { FormMessage } from "@/src/components/atoms/form-message";
import { useTranslation } from "@/src/lib/i18n";
import { selectSmall } from "@/src/components/ui/theme-constants";

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
}

interface CreateApiKeyPresentationProps {
  visible: boolean;
  onHide: () => void;
  error: string;
  organizations: Organization[];
}

const PERMISSION_GROUPS = [
  {
    resource: "organizations",
    read: "read:organizations",
    write: "write:organizations",
  },
  {
    resource: "email-templates",
    read: "read:email-templates",
    write: "write:email-templates",
  },
  { resource: "pages", read: "read:pages", write: "write:pages" },
  { resource: "files", read: "read:files", write: "write:files" },
  { resource: "jobs", read: "read:jobs", write: null },
];

export function CreateApiKeyPresentation({
  visible,
  onHide,
  error,
  organizations,
}: CreateApiKeyPresentationProps) {
  const t = useTranslation();
  const { values, setFieldValue, isSubmitting } =
    useFormikContext<CreateApiKeyValues>();

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
          <label className="mb-1 block text-sm font-medium text-zinc-300">
            {t("apiKeys.name")}
          </label>
          <Field
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
            <label className="mb-1 block text-sm font-medium text-zinc-300">
              {t("apiKeys.organizations")}
            </label>
            <MultiSelect
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
          <label className="mb-2 block text-sm font-medium text-zinc-300">
            {t("apiKeys.permissions")}
          </label>
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
                        onChange={() =>
                          setFieldValue(
                            `permissions.${group.write}`,
                            !values.permissions[group.write],
                          )
                        }
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
          <label className="mb-1 block text-sm font-medium text-zinc-300">
            {t("apiKeys.expiration")}
          </label>
          <Dropdown
            pt={selectSmall}
            value={values.expiresInDays}
            options={expiresOptions}
            onChange={(e) => setFieldValue("expiresInDays", e.value)}
            className="w-full"
          />
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
