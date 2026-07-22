"use client";

import { ErrorMessage, Field, Form, useFormikContext } from "formik";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Checkbox } from "primereact/checkbox";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputSwitch } from "primereact/inputswitch";
import { InputText } from "primereact/inputtext";
import { MultiSelect } from "primereact/multiselect";
import type { ScheduleFormValues } from "@next-phish/shared";
import { FormMessage } from "@/src/components/atoms/form-message";
import {
  inputNumberSmall,
  selectSmall,
} from "@/src/components/ui/theme-constants";

interface Props {
  campaigns: Array<{ id: string; name: string; type: "TEMPLATE" | "CONCRETE" }>;
  targetGroups: Array<{ id: string; name: string; userCount: number }>;
  error: string;
  onCancel: () => void;
}

const scheduleTypeOptions = [
  { label: "One time", value: "ONE_TIME" },
  { label: "Repeating", value: "RECURRING" },
];
const deliveryOptions = ["BLAST", "DRIP", "BATCH"].map((value) => ({
  label: value.charAt(0) + value.slice(1).toLowerCase(),
  value,
}));
const frequencyOptions = [
  "WEEKLY",
  "MONTHLY",
  "QUARTERLY",
  "HALF_YEARLY",
  "YEARLY",
].map((value) => ({ label: value.replaceAll("_", " "), value }));
const strategyOptions = [
  { label: "Deck", value: "DECK" },
  { label: "Random", value: "RANDOM" },
];

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

function fromLocalValue(value: string | null): Date | null {
  return value ? new Date(value) : null;
}

function toLocalValue(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-medium text-zinc-300"
    >
      {children}
    </label>
  );
}

function ScheduleDetailsSection({
  campaigns,
  targetGroups,
}: Pick<Props, "campaigns" | "targetGroups">) {
  const { values, setFieldValue } = useFormikContext<ScheduleFormValues>();
  const selectedSourceIds = new Set(values.sourceCampaignIds);
  const selectedCampaigns = campaigns.filter((campaign) =>
    selectedSourceIds.has(campaign.id),
  );
  const requiresTargetGroup =
    values.type === "RECURRING" ||
    selectedCampaigns.some((campaign) => campaign.type === "TEMPLATE");
  const inheritsTargetGroup =
    values.type === "ONE_TIME" && selectedCampaigns[0]?.type === "CONCRETE";
  const repeatingSources = campaigns.filter(
    (campaign) => campaign.type === "TEMPLATE",
  );

  return (
    <section className="rounded-2xl border border-[#1C2945] bg-brand-dark p-5">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-white">Schedule details</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Select campaign sources, audience, and the first occurrence.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <FieldLabel htmlFor="schedule-name">Schedule name</FieldLabel>
          <Field
            as={InputText}
            id="schedule-name"
            name="name"
            size="small"
            placeholder="Quarterly awareness schedule"
            className="w-full"
          />
          <ErrorMessage
            name="name"
            component="p"
            className="text-sm text-red-400"
          />
        </div>

        <div className="space-y-2">
          <FieldLabel htmlFor="schedule-type">Schedule type</FieldLabel>
          <Dropdown
            inputId="schedule-type"
            value={values.type}
            options={scheduleTypeOptions}
            onChange={(event) => {
              void setFieldValue("type", event.value);
              void setFieldValue("sourceCampaignIds", []);
              void setFieldValue("targetGroupId", null);
            }}
            pt={selectSmall}
            className="w-full"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <FieldLabel htmlFor="schedule-source">Campaign source</FieldLabel>
          {values.type === "RECURRING" ? (
            <MultiSelect
              inputId="schedule-source"
              value={values.sourceCampaignIds}
              options={repeatingSources}
              optionLabel="name"
              optionValue="id"
              filter
              filterPlaceholder="Search campaign templates"
              placeholder="Select campaign templates"
              display="chip"
              onChange={(event) =>
                void setFieldValue("sourceCampaignIds", event.value)
              }
              className="w-full"
            />
          ) : (
            <Dropdown
              inputId="schedule-source"
              value={values.sourceCampaignIds[0] ?? null}
              options={campaigns}
              optionLabel="name"
              optionValue="id"
              filter
              filterPlaceholder="Search campaigns"
              checkmark
              placeholder="Select a campaign"
              onChange={(event) => {
                void setFieldValue("sourceCampaignIds", [event.value]);
                void setFieldValue("targetGroupId", null);
              }}
              pt={selectSmall}
              className="w-full"
            />
          )}
          <ErrorMessage
            name="sourceCampaignIds"
            component="p"
            className="text-sm text-red-400"
          />
        </div>

        <div className="space-y-2">
          <FieldLabel htmlFor="schedule-target-group">
            {requiresTargetGroup ? "Target group *" : "Target group"}
          </FieldLabel>
          <Dropdown
            inputId="schedule-target-group"
            value={values.targetGroupId}
            options={targetGroups}
            optionLabel="name"
            optionValue="id"
            filter
            filterPlaceholder="Search target groups"
            checkmark
            showClear={!requiresTargetGroup}
            disabled={inheritsTargetGroup}
            placeholder={
              inheritsTargetGroup
                ? "Inherited from the concrete campaign"
                : "Select a target group"
            }
            onChange={(event) => {
              void setFieldValue("targetGroupId", event.value);
              const group = targetGroups.find(
                (item) => item.id === event.value,
              );
              if (group && group.userCount > 600) {
                void setFieldValue("deliveryMode", "DRIP");
                void setFieldValue("dripEmailsPerMinute", 60);
                void setFieldValue("batchSize", null);
                void setFieldValue("batchIntervalMinutes", null);
              }
            }}
            pt={selectSmall}
            className="w-full"
          />
          {requiresTargetGroup ? (
            <p className="text-xs text-zinc-400">
              Template schedules need an audience for every generated campaign.
            </p>
          ) : null}
          <ErrorMessage
            name="targetGroupId"
            component="p"
            className="text-sm text-red-400"
          />
        </div>

        <div className="space-y-2">
          <FieldLabel htmlFor="schedule-timezone">Target timezone</FieldLabel>
          <Dropdown
            inputId="schedule-timezone"
            value={values.targetTimezone}
            options={timezoneOptions}
            filter
            filterPlaceholder="Search timezones"
            checkmark
            onChange={(event) =>
              void setFieldValue("targetTimezone", event.value)
            }
            pt={selectSmall}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <FieldLabel htmlFor="schedule-start">First occurrence</FieldLabel>
          <Calendar
            inputId="schedule-start"
            value={fromLocalValue(values.startsAt)}
            dateFormat="mm/dd/yy"
            showTime
            hourFormat="12"
            showIcon
            onChange={(event) => {
              if (event.value instanceof Date)
                void setFieldValue("startsAt", toLocalValue(event.value));
            }}
            className="w-full"
          />
          <ErrorMessage
            name="startsAt"
            component="p"
            className="text-sm text-red-400"
          />
        </div>
      </div>
    </section>
  );
}

function RecurrenceSection() {
  const { values, setFieldValue } = useFormikContext<ScheduleFormValues>();
  if (values.type !== "RECURRING") return null;

  return (
    <section className="rounded-2xl border border-[#1C2945] bg-brand-dark p-5">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-white">Recurrence</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Control when templates are selected and repeated.
        </p>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        <div className="space-y-2">
          <FieldLabel htmlFor="schedule-frequency">Frequency</FieldLabel>
          <Dropdown
            inputId="schedule-frequency"
            value={values.frequency}
            options={frequencyOptions}
            onChange={(event) => void setFieldValue("frequency", event.value)}
            pt={selectSmall}
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <FieldLabel htmlFor="schedule-strategy">
            Selection strategy
          </FieldLabel>
          <Dropdown
            inputId="schedule-strategy"
            value={values.selectionStrategy}
            options={strategyOptions}
            onChange={(event) =>
              void setFieldValue("selectionStrategy", event.value)
            }
            pt={selectSmall}
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <FieldLabel htmlFor="schedule-local-time">
            Minutes after midnight
          </FieldLabel>
          <InputNumber
            inputId="schedule-local-time"
            value={values.localTimeMinutes}
            min={0}
            max={1439}
            onValueChange={(event) =>
              void setFieldValue("localTimeMinutes", event.value ?? null)
            }
            pt={inputNumberSmall}
          />
        </div>
        {values.frequency === "WEEKLY" ? (
          <div className="space-y-2">
            <FieldLabel htmlFor="schedule-weekday">Weekday (0–6)</FieldLabel>
            <InputNumber
              inputId="schedule-weekday"
              value={values.weekday}
              min={0}
              max={6}
              onValueChange={(event) =>
                void setFieldValue("weekday", event.value ?? null)
              }
              pt={inputNumberSmall}
            />
          </div>
        ) : null}
        {values.frequency && values.frequency !== "WEEKLY" ? (
          <div className="space-y-2">
            <FieldLabel htmlFor="schedule-day-of-month">
              Day of month
            </FieldLabel>
            <InputNumber
              inputId="schedule-day-of-month"
              value={values.dayOfMonth}
              min={1}
              max={31}
              onValueChange={(event) =>
                void setFieldValue("dayOfMonth", event.value ?? null)
              }
              pt={inputNumberSmall}
            />
          </div>
        ) : null}
        {["QUARTERLY", "HALF_YEARLY", "YEARLY"].includes(
          values.frequency ?? "",
        ) ? (
          <div className="space-y-2">
            <FieldLabel htmlFor="schedule-month">Month in period</FieldLabel>
            <InputNumber
              inputId="schedule-month"
              value={values.month}
              min={1}
              max={
                values.frequency === "QUARTERLY"
                  ? 3
                  : values.frequency === "HALF_YEARLY"
                    ? 6
                    : 12
              }
              onValueChange={(event) =>
                void setFieldValue("month", event.value ?? null)
              }
              pt={inputNumberSmall}
            />
          </div>
        ) : null}
        {values.selectionStrategy === "DECK" ? (
          <label
            htmlFor="schedule-shuffle"
            className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300 md:col-span-3"
          >
            <Checkbox
              inputId="schedule-shuffle"
              checked={values.shuffleDeck}
              onChange={(event) =>
                void setFieldValue("shuffleDeck", Boolean(event.checked))
              }
            />
            Shuffle the deck before the first occurrence
          </label>
        ) : null}
      </div>
    </section>
  );
}

function DeliverySection() {
  const { values, setFieldValue } = useFormikContext<ScheduleFormValues>();
  return (
    <section className="rounded-2xl border border-[#1C2945] bg-brand-dark p-5">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-white">Delivery</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Choose how recipients are paced through each campaign.
        </p>
      </div>
      <div className="grid max-w-4xl gap-5 md:grid-cols-3">
        <div className="space-y-2">
          <FieldLabel htmlFor="schedule-delivery">Delivery mode</FieldLabel>
          <Dropdown
            inputId="schedule-delivery"
            value={values.deliveryMode}
            options={deliveryOptions}
            onChange={(event) => {
              void setFieldValue("deliveryMode", event.value);
              void setFieldValue(
                "dripEmailsPerMinute",
                event.value === "DRIP"
                  ? (values.dripEmailsPerMinute ?? 60)
                  : null,
              );
              void setFieldValue(
                "batchSize",
                event.value === "BATCH" ? (values.batchSize ?? 100) : null,
              );
              void setFieldValue(
                "batchIntervalMinutes",
                event.value === "BATCH"
                  ? (values.batchIntervalMinutes ?? 60)
                  : null,
              );
            }}
            pt={selectSmall}
            className="w-full"
          />
        </div>
        {values.deliveryMode === "DRIP" ? (
          <div className="space-y-2">
            <FieldLabel htmlFor="schedule-drip-rate">
              Emails per minute
            </FieldLabel>
            <InputNumber
              inputId="schedule-drip-rate"
              value={values.dripEmailsPerMinute}
              min={1}
              onValueChange={(event) =>
                void setFieldValue("dripEmailsPerMinute", event.value ?? null)
              }
              pt={inputNumberSmall}
            />
          </div>
        ) : null}
        {values.deliveryMode === "BATCH" ? (
          <>
            <div className="space-y-2">
              <FieldLabel htmlFor="schedule-batch-size">Batch size</FieldLabel>
              <InputNumber
                inputId="schedule-batch-size"
                value={values.batchSize}
                min={1}
                onValueChange={(event) =>
                  void setFieldValue("batchSize", event.value ?? null)
                }
                pt={inputNumberSmall}
              />
            </div>
            <div className="space-y-2">
              <FieldLabel htmlFor="schedule-batch-interval">
                Interval in minutes
              </FieldLabel>
              <InputNumber
                inputId="schedule-batch-interval"
                value={values.batchIntervalMinutes}
                min={1}
                onValueChange={(event) =>
                  void setFieldValue(
                    "batchIntervalMinutes",
                    event.value ?? null,
                  )
                }
                pt={inputNumberSmall}
              />
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}

function CompletionSection() {
  const { values, setFieldValue } = useFormikContext<ScheduleFormValues>();
  return (
    <section className="rounded-2xl border border-[#1C2945] bg-brand-dark p-5">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-white">Completion</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Configure schedule limits and automatic campaign completion.
        </p>
      </div>
      <div className="grid max-w-4xl gap-5 md:grid-cols-2">
        {values.type === "RECURRING" ? (
          <>
            <div className="space-y-2">
              <FieldLabel htmlFor="schedule-max-campaigns">
                Maximum campaigns (optional)
              </FieldLabel>
              <InputNumber
                inputId="schedule-max-campaigns"
                value={values.maxCampaigns}
                min={1}
                onValueChange={(event) =>
                  void setFieldValue("maxCampaigns", event.value ?? null)
                }
                pt={inputNumberSmall}
              />
            </div>
            <div className="space-y-2">
              <FieldLabel htmlFor="schedule-end">
                End date (optional)
              </FieldLabel>
              <Calendar
                inputId="schedule-end"
                value={fromLocalValue(values.endsAt)}
                dateFormat="mm/dd/yy"
                showTime
                hourFormat="12"
                showIcon
                onChange={(event) =>
                  void setFieldValue(
                    "endsAt",
                    event.value instanceof Date
                      ? toLocalValue(event.value)
                      : null,
                  )
                }
                className="w-full"
              />
            </div>
          </>
        ) : null}

        <div className="flex items-start gap-3 md:col-span-2">
          <InputSwitch
            inputId="schedule-auto-complete"
            checked={values.autoCompleteAfterDays !== null}
            onChange={(event) =>
              void setFieldValue(
                "autoCompleteAfterDays",
                event.value ? (values.autoCompleteAfterDays ?? 20) : null,
              )
            }
          />
          <label htmlFor="schedule-auto-complete" className="cursor-pointer">
            <span className="block text-sm font-medium text-zinc-300">
              Automatically complete each campaign
            </span>
            <span className="mt-0.5 block text-sm text-zinc-400">
              Defaults to 20 days after the campaign starts.
            </span>
          </label>
        </div>

        {values.autoCompleteAfterDays !== null ? (
          <div className="space-y-2">
            <FieldLabel htmlFor="schedule-completion-days">
              Completion duration
            </FieldLabel>
            <InputNumber
              inputId="schedule-completion-days"
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

export function ScheduleFormPresentation({
  campaigns,
  targetGroups,
  error,
  onCancel,
}: Props) {
  const { values, isSubmitting } = useFormikContext<ScheduleFormValues>();
  const selectedGroup = targetGroups.find(
    (group) => group.id === values.targetGroupId,
  );

  return (
    <Form className="space-y-6">
      <ScheduleDetailsSection
        campaigns={campaigns}
        targetGroups={targetGroups}
      />

      {selectedGroup && selectedGroup.userCount > 600 ? (
        <FormMessage variant="success">
          For {selectedGroup.userCount} recipients, Drip at 60 emails per minute
          is recommended and remains configurable.
        </FormMessage>
      ) : null}

      <RecurrenceSection />

      <DeliverySection />

      <CompletionSection />

      {error ? <FormMessage variant="error">{error}</FormMessage> : null}

      <section className="rounded-2xl border border-[#1C2945] bg-brand-dark p-5">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            size="small"
            outlined
            label="Cancel"
            onClick={onCancel}
          />
          <Button
            type="submit"
            size="small"
            label="Save schedule"
            loading={isSubmitting}
            disabled={isSubmitting}
          />
        </div>
      </section>
    </Form>
  );
}
