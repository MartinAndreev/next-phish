"use client";

import { ErrorMessage, useFormikContext } from "formik";
import { Chips } from "primereact/chips";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputSwitch } from "primereact/inputswitch";
import type { CampaignFormValues } from "@next-phish/shared";
import { FormField } from "@/src/components/molecules/form-field";
import {
  inputNumberSmall,
  selectSmall,
} from "@/src/components/ui/theme-constants";

interface GeneralTabProps {
  targetGroups: Array<{ id: string; name: string; userCount: number }>;
  isEdit: boolean;
}

const inputClassName = "w-full";

function getTimezones(): string[] {
  try {
    return Intl.supportedValuesOf("timeZone");
  } catch {
    return ["UTC"];
  }
}

const timezoneOptions = getTimezones().map((timeZone) => ({
  label: timeZone,
  value: timeZone,
}));

const campaignTypeOptions = [
  { label: "Campaign template", value: "TEMPLATE" },
  { label: "Concrete campaign", value: "CONCRETE" },
];

const campaignStatusOptions = [
  { label: "Draft", value: "DRAFT" },
  { label: "Published", value: "PUBLISHED" },
];

export function GeneralTab({ targetGroups, isEdit }: GeneralTabProps) {
  const { values, setFieldValue } = useFormikContext<CampaignFormValues>();

  return (
    <section className="rounded-2xl border border-[#1C2945] bg-brand-dark p-5 shadow-[0_20px_45px_rgba(2,11,29,0.28)]">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-white">General</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Name, organize, and define the campaign lifecycle.
        </p>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <FormField
            name="name"
            label="Campaign name"
            placeholder="Quarterly security awareness"
            inputClassName={inputClassName}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label
            htmlFor="campaign-tags"
            className="block text-sm font-medium text-zinc-100"
          >
            Campaign tags
          </label>
          <Chips
            inputId="campaign-tags"
            value={values.tags}
            separator=","
            onChange={(event) => void setFieldValue("tags", event.value ?? [])}
            placeholder="security, quarterly, onboarding"
            className="w-full"
          />
          <ErrorMessage
            name="tags"
            component="p"
            className="text-sm text-red-400"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="campaign-type"
            className="block text-sm font-medium text-zinc-100"
          >
            Campaign type
          </label>
          <Dropdown
            inputId="campaign-type"
            pt={selectSmall}
            value={values.type}
            options={campaignTypeOptions}
            disabled={isEdit}
            onChange={(event) => {
              void setFieldValue("type", event.value);
              if (event.value === "TEMPLATE") {
                void setFieldValue("targetGroupId", null);
                void setFieldValue("scheduleEnabled", false);
              } else {
                void setFieldValue("status", "PUBLISHED");
                void setFieldValue("scheduleEnabled", true);
              }
            }}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="campaign-status"
            className="block text-sm font-medium text-zinc-100"
          >
            Status
          </label>
          <Dropdown
            inputId="campaign-status"
            pt={selectSmall}
            value={values.status}
            options={campaignStatusOptions}
            onChange={(event) => {
              void setFieldValue("status", event.value);
              if (event.value === "DRAFT")
                void setFieldValue("scheduleEnabled", false);
            }}
            className="w-full"
          />
          {values.type === "CONCRETE" && values.scheduleEnabled ? (
            <p className="text-xs text-zinc-500">
              Scheduled campaigns are published when saved.
            </p>
          ) : null}
          <ErrorMessage
            name="status"
            component="p"
            className="text-sm text-red-400"
          />
        </div>

        {values.type === "CONCRETE" ? (
          <div className="space-y-2">
            <label
              htmlFor="campaign-target-group"
              className="block text-sm font-medium text-zinc-100"
            >
              Target group
            </label>
            <Dropdown
              inputId="campaign-target-group"
              pt={selectSmall}
              value={values.targetGroupId}
              options={targetGroups}
              optionLabel="name"
              optionValue="id"
              filter
              filterPlaceholder="Search target groups"
              checkmark
              placeholder="Select a target group"
              onChange={(event) => {
                void setFieldValue("targetGroupId", event.value);
                const group = targetGroups.find(
                  (item) => item.id === event.value,
                );
                if (group && group.userCount > 600) {
                  void setFieldValue("scheduleDeliveryMode", "DRIP");
                  void setFieldValue("scheduleDripEmailsPerMinute", 60);
                  void setFieldValue("scheduleBatchSize", null);
                  void setFieldValue("scheduleBatchIntervalMinutes", null);
                }
              }}
              className="w-full"
            />
            <ErrorMessage
              name="targetGroupId"
              component="p"
              className="text-sm text-red-400"
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <label
            htmlFor="campaign-timezone"
            className="block text-sm font-medium text-zinc-100"
          >
            Target timezone
          </label>
          <Dropdown
            inputId="campaign-timezone"
            pt={selectSmall}
            value={values.targetTimezone}
            options={timezoneOptions}
            filter
            filterPlaceholder="Search timezones"
            checkmark
            onChange={(event) => {
              void setFieldValue("targetTimezone", event.value);
              if (!values.scheduleEnabled)
                void setFieldValue("scheduleTargetTimezone", event.value);
            }}
            className="w-full"
          />
          <ErrorMessage
            name="targetTimezone"
            component="p"
            className="text-sm text-red-400"
          />
        </div>

        <div className="flex items-start gap-3 md:col-span-2">
          <InputSwitch
            inputId="campaign-auto-complete"
            aria-label="Automatically complete campaign"
            checked={values.automaticallyComplete}
            onChange={(event) => {
              void setFieldValue("automaticallyComplete", event.value);
              void setFieldValue(
                "autoCompleteAfterDays",
                event.value ? (values.autoCompleteAfterDays ?? 20) : null,
              );
            }}
          />
          <label htmlFor="campaign-auto-complete" className="cursor-pointer">
            <span className="block text-sm font-medium text-zinc-300">
              Automatically complete campaign
            </span>
            <span className="mt-0.5 block text-sm text-zinc-400">
              Complete the campaign a fixed number of days after it starts.
            </span>
          </label>
        </div>

        {values.automaticallyComplete ? (
          <div className="max-w-xs space-y-2 md:col-span-2">
            <label
              htmlFor="campaign-auto-complete-days"
              className="block text-sm font-medium text-zinc-300"
            >
              Completion duration
            </label>
            <InputNumber
              inputId="campaign-auto-complete-days"
              value={values.autoCompleteAfterDays}
              min={1}
              suffix=" days"
              onValueChange={(event) =>
                void setFieldValue("autoCompleteAfterDays", event.value ?? null)
              }
              pt={inputNumberSmall}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
