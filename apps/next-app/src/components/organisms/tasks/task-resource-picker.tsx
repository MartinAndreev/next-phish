"use client";

import { useEffect, useRef, useState } from "react";
import { ErrorMessage, useFormikContext } from "formik";
import { Dropdown, type DropdownFilterEvent } from "primereact/dropdown";
import type { TaskFormValues, TaskResourceType } from "@next-phish/shared";
import { trpc } from "@/src/lib/trpc";
import { useTranslation } from "@/src/lib/i18n/client";
import { selectSmall } from "@/src/components/ui/theme-constants";

interface ResourceOption {
  id: string;
  name: string;
}

export function TaskResourcePicker({
  currentResource,
}: {
  currentResource?: ResourceOption;
}) {
  const t = useTranslation();
  const { values, setFieldValue, setFieldTouched } =
    useFormikContext<TaskFormValues>();
  const type = values.relation?.type;
  const [search, setSearch] = useState("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  const campaign = trpc.campaign.list.useQuery(
    { search: search || undefined, limit: 20, offset: 0 },
    { enabled: type === "CAMPAIGN" },
  );
  const schedule = trpc.campaign.listSchedules.useQuery(
    { search: search || undefined, limit: 20, offset: 0 },
    { enabled: type === "SCHEDULE" },
  );
  const page = trpc.page.list.useQuery(
    {
      search: search || undefined,
      selectedId: type === "PAGE" ? values.relation?.id : undefined,
      includeContent: false,
      limit: 20,
      offset: 0,
    },
    { enabled: type === "PAGE" },
  );
  const emailTemplate = trpc.emailTemplate.list.useQuery(
    {
      search: search || undefined,
      selectedId: type === "EMAIL_TEMPLATE" ? values.relation?.id : undefined,
      includeContent: false,
      limit: 20,
      offset: 0,
    },
    { enabled: type === "EMAIL_TEMPLATE" },
  );
  const targetGroup = trpc.targetGroup.list.useQuery(
    { search: search || undefined, limit: 20, offset: 0 },
    { enabled: type === "TARGET_GROUP" },
  );
  const sendingProfile = trpc.mailSending.list.useQuery(
    { search: search || undefined, limit: 20, offset: 0 },
    { enabled: type === "SENDING_PROFILE" },
  );

  const byType: Partial<Record<TaskResourceType, ResourceOption[]>> = {
    CAMPAIGN: campaign.data?.rows ?? [],
    SCHEDULE: schedule.data?.rows ?? [],
    PAGE: page.data?.pages ?? [],
    EMAIL_TEMPLATE: emailTemplate.data?.emailTemplates ?? [],
    TARGET_GROUP: targetGroup.data?.targetGroups ?? [],
    SENDING_PROFILE: sendingProfile.data?.profiles ?? [],
  };
  const loading =
    campaign.isLoading ||
    schedule.isLoading ||
    page.isLoading ||
    emailTemplate.isLoading ||
    targetGroup.isLoading ||
    sendingProfile.isLoading;
  const options = type ? [...(byType[type] ?? [])] : [];
  if (
    currentResource &&
    values.relation?.id === currentResource.id &&
    !options.some((option) => option.id === currentResource.id)
  ) {
    options.unshift(currentResource);
  }

  const typeOptions = [
    { label: t("tasks.none"), value: null },
    { label: t("tasks.campaign"), value: "CAMPAIGN" },
    { label: t("tasks.schedule"), value: "SCHEDULE" },
    { label: t("tasks.page"), value: "PAGE" },
    { label: t("tasks.emailTemplate"), value: "EMAIL_TEMPLATE" },
    { label: t("tasks.targetGroup"), value: "TARGET_GROUP" },
    { label: t("tasks.sendingProfile"), value: "SENDING_PROFILE" },
  ];
  function handleFilter(event: DropdownFilterEvent) {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setSearch(event.filter), 300);
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label
        htmlFor="task-relation-type"
        className="block text-sm text-zinc-300"
      >
        {t("tasks.relatedType")}
        <Dropdown
          inputId="task-relation-type"
          aria-label={t("tasks.relatedType")}
          value={type ?? null}
          options={typeOptions}
          onChange={(event) => {
            setSearch("");
            setFieldValue(
              "relation",
              event.value ? { type: event.value, id: "" } : null,
            );
          }}
          onBlur={() => setFieldTouched("relation.type", true)}
          className="mt-1 w-full"
          pt={selectSmall}
        />
      </label>
      {type ? (
        <label
          htmlFor="task-relation-id"
          className="block text-sm text-zinc-300"
        >
          {t("tasks.relatedResource")}
          <Dropdown
            inputId="task-relation-id"
            aria-label={t("tasks.relatedResource")}
            value={values.relation?.id || null}
            options={options}
            optionLabel="name"
            optionValue="id"
            filter
            filterBy="name"
            resetFilterOnHide
            loading={loading}
            emptyFilterMessage={t("tasks.noResources")}
            emptyMessage={t("tasks.noResources")}
            placeholder={t("tasks.searchResource")}
            onFilter={handleFilter}
            onChange={(event) =>
              setFieldValue("relation", { type, id: event.value })
            }
            onBlur={() => setFieldTouched("relation.id", true)}
            className="mt-1 w-full"
            pt={selectSmall}
          />
          <ErrorMessage
            name="relation.id"
            component="p"
            className="mt-1 text-xs text-red-400"
          />
        </label>
      ) : (
        <div />
      )}
    </div>
  );
}
