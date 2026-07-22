"use client";

import { ErrorMessage, useFormikContext } from "formik";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputSwitch } from "primereact/inputswitch";
import type { CampaignFormValues } from "@next-phish/shared";
import { FormMessage } from "@/src/components/atoms/form-message";
import {
  inputNumberSmall,
  selectSmall,
} from "@/src/components/ui/theme-constants";

interface ScheduleTabProps {
  recipientCount: number;
  hasExistingSchedule: boolean;
}

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

function toLocalFormValue(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function ScheduleTab({
  recipientCount,
  hasExistingSchedule,
}: ScheduleTabProps) {
  const { values, setFieldValue } = useFormikContext<CampaignFormValues>();

  return (
    <section className="rounded-2xl border border-[#1C2945] bg-brand-dark p-5 shadow-[0_20px_45px_rgba(2,11,29,0.28)]">
      <div className="flex items-start gap-3">
        <InputSwitch
          inputId="campaign-schedule-enabled"
          aria-label="Enable campaign schedule"
          checked={values.scheduleEnabled}
          disabled={hasExistingSchedule}
          onChange={(event) => {
            void setFieldValue("scheduleEnabled", event.value);
            if (event.value) void setFieldValue("status", "PUBLISHED");
          }}
        />
        <label htmlFor="campaign-schedule-enabled" className="cursor-pointer">
          <span className="block text-base font-medium text-white">
            Schedule campaign
          </span>
          <span className="mt-0.5 block text-sm text-zinc-400">
            Create a one-time schedule when this concrete campaign is saved.
          </span>
        </label>
      </div>

      {hasExistingSchedule ? (
        <p className="mt-3 text-xs text-zinc-500">
          This campaign already has a schedule. Edit its settings below or
          cancel it from the Schedule area.
        </p>
      ) : null}

      {values.scheduleEnabled ? (
        <div className="mt-6 max-w-4xl space-y-5">
          {recipientCount > 600 ? (
            <FormMessage variant="success">
              This group contains {recipientCount} recipients. Drip at 60 emails
              per minute is recommended, but remains configurable.
            </FormMessage>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="campaign-schedule-start"
                className="block text-sm font-medium text-zinc-300"
              >
                Start date and time
              </label>
              <Calendar
                inputId="campaign-schedule-start"
                value={
                  values.scheduleStartsAt
                    ? new Date(values.scheduleStartsAt)
                    : null
                }
                onChange={(event) => {
                  if (event.value instanceof Date)
                    void setFieldValue(
                      "scheduleStartsAt",
                      toLocalFormValue(event.value),
                    );
                }}
                dateFormat="mm/dd/yy"
                showTime
                hourFormat="12"
                showIcon
                className="w-full"
              />
              <ErrorMessage
                name="scheduleStartsAt"
                component="p"
                className="text-sm text-red-400"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="campaign-schedule-timezone"
                className="block text-sm font-medium text-zinc-300"
              >
                Schedule timezone
              </label>
              <Dropdown
                inputId="campaign-schedule-timezone"
                pt={selectSmall}
                value={values.scheduleTargetTimezone}
                options={timezoneOptions}
                filter
                filterPlaceholder="Search timezones"
                checkmark
                onChange={(event) =>
                  void setFieldValue("scheduleTargetTimezone", event.value)
                }
                className="w-full"
              />
              <ErrorMessage
                name="scheduleTargetTimezone"
                component="p"
                className="text-sm text-red-400"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="campaign-delivery-mode"
                className="block text-sm font-medium text-zinc-300"
              >
                Delivery mode
              </label>
              <Dropdown
                inputId="campaign-delivery-mode"
                pt={selectSmall}
                value={values.scheduleDeliveryMode}
                options={[
                  { label: "Blast", value: "BLAST" },
                  { label: "Drip", value: "DRIP" },
                  { label: "Batch", value: "BATCH" },
                ]}
                onChange={(event) => {
                  const mode = event.value;
                  void setFieldValue("scheduleDeliveryMode", mode);
                  void setFieldValue(
                    "scheduleDripEmailsPerMinute",
                    mode === "DRIP"
                      ? (values.scheduleDripEmailsPerMinute ?? 60)
                      : null,
                  );
                  void setFieldValue(
                    "scheduleBatchSize",
                    mode === "BATCH" ? (values.scheduleBatchSize ?? 100) : null,
                  );
                  void setFieldValue(
                    "scheduleBatchIntervalMinutes",
                    mode === "BATCH"
                      ? (values.scheduleBatchIntervalMinutes ?? 60)
                      : null,
                  );
                }}
                className="w-full"
              />
            </div>

            {values.scheduleDeliveryMode === "DRIP" ? (
              <div className="space-y-2">
                <label
                  htmlFor="campaign-drip-rate"
                  className="block text-sm font-medium text-zinc-300"
                >
                  Emails per minute
                </label>
                <InputNumber
                  inputId="campaign-drip-rate"
                  value={values.scheduleDripEmailsPerMinute}
                  min={1}
                  onValueChange={(event) =>
                    void setFieldValue(
                      "scheduleDripEmailsPerMinute",
                      event.value ?? null,
                    )
                  }
                  pt={inputNumberSmall}
                />
              </div>
            ) : null}

            {values.scheduleDeliveryMode === "BATCH" ? (
              <>
                <div className="space-y-2">
                  <label
                    htmlFor="campaign-batch-size"
                    className="block text-sm font-medium text-zinc-300"
                  >
                    Batch size
                  </label>
                  <InputNumber
                    inputId="campaign-batch-size"
                    value={values.scheduleBatchSize}
                    min={1}
                    onValueChange={(event) =>
                      void setFieldValue(
                        "scheduleBatchSize",
                        event.value ?? null,
                      )
                    }
                    pt={inputNumberSmall}
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="campaign-batch-interval"
                    className="block text-sm font-medium text-zinc-300"
                  >
                    Interval in minutes
                  </label>
                  <InputNumber
                    inputId="campaign-batch-interval"
                    value={values.scheduleBatchIntervalMinutes}
                    min={1}
                    onValueChange={(event) =>
                      void setFieldValue(
                        "scheduleBatchIntervalMinutes",
                        event.value ?? null,
                      )
                    }
                    pt={inputNumberSmall}
                  />
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="mt-5 max-w-4xl rounded-xl border border-dashed border-white/10 px-5 py-8 text-center text-sm text-zinc-400">
          The campaign will be saved without a schedule. It can be scheduled
          later from its detail page.
        </p>
      )}
    </section>
  );
}
