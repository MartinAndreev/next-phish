"use client";

import { Field, useFormikContext } from "formik";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { FormMessage } from "@/src/components/atoms/form-message";
import { useTranslation } from "@/src/lib/i18n";
import { selectSmall } from "@/src/components/ui/theme-constants";

interface FormUser {
  _key: string;
  email: string;
  firstName: string;
  lastName: string;
  position: string;
}

interface TargetGroupFormPresentationProps {
  error: string;
  isEdit?: boolean;
}

export function TargetGroupFormPresentation({
  error,
  isEdit,
}: TargetGroupFormPresentationProps) {
  const t = useTranslation();
  const { values, setFieldValue } = useFormikContext<{
    name: string;
    status: string;
    users: FormUser[];
  }>();

  const statusOptions = [
    { label: t("common.draft"), value: "DRAFT" },
    { label: t("common.active"), value: "ACTIVE" },
    { label: t("targetGroups.archived"), value: "ARCHIVED" },
  ];

  function addUser() {
    const newUsers = [
      ...values.users,
      {
        _key: crypto.randomUUID(),
        email: "",
        firstName: "",
        lastName: "",
        position: "",
      },
    ];
    setFieldValue("users", newUsers);
  }

  function removeUser(index: number) {
    const newUsers = values.users.filter((_, i) => i !== index);
    setFieldValue("users", newUsers);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:grid md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-300">
            {t("targetGroups.name")}
          </label>
          <Field
            as={InputText}
            name="name"
            size="small"
            placeholder={t("targetGroups.namePlaceholder")}
            className="w-full"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-300">
            {t("targetGroups.status")}
          </label>
          <Field
            as={Dropdown}
            pt={selectSmall}
            name="status"
            options={statusOptions}
            className="w-full"
          />
        </div>
      </div>

      {!isEdit && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-medium text-white">
              {t("targetGroups.users")}
            </h3>
            <Button
              type="button"
              size="small"
              label={t("targetGroups.addUser")}
              icon="pi pi-plus"
              severity="secondary"
              onClick={addUser}
            />
          </div>

          {values.users.length === 0 && (
            <p className="text-sm text-zinc-400">{t("targetGroups.noUsers")}</p>
          )}

          <div className="flex flex-col gap-3">
            {values.users.map((user, index) => (
              <div
                key={user._key}
                className="grid grid-cols-1 gap-3 rounded-lg border border-[#1C2945] bg-brand-navy/50 p-4 md:grid-cols-4"
              >
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-400">
                    {t("targetGroups.email")} *
                  </label>
                  <Field
                    as={InputText}
                    name={`users.${index}.email`}
                    placeholder="email@example.com"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-400">
                    {t("targetGroups.firstName")} *
                  </label>
                  <Field
                    as={InputText}
                    name={`users.${index}.firstName`}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-400">
                    {t("targetGroups.lastName")} *
                  </label>
                  <Field
                    as={InputText}
                    name={`users.${index}.lastName`}
                    className="w-full"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs font-medium text-zinc-400">
                      {t("targetGroups.position")}
                    </label>
                    <Field
                      as={InputText}
                      name={`users.${index}.position`}
                      placeholder={t("targetGroups.positionPlaceholder")}
                      className="w-full"
                    />
                  </div>
                  <Button
                    type="button"
                    icon="pi pi-trash"
                    severity="danger"
                    text
                    onClick={() => removeUser(index)}
                    aria-label={t("targetGroups.removeUser")}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <FormMessage variant="error">{error}</FormMessage>}
    </div>
  );
}
