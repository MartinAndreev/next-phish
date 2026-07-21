"use client";

import { Formik } from "formik";
import { useRouter } from "next/navigation";
import { BreadCrumb } from "primereact/breadcrumb";
import {
  scheduleFormSchema,
  type ScheduleFormValues,
} from "@next-phish/shared";
import { FormSkeleton } from "@/src/components/atoms/form-skeleton";
import { useFormStatus } from "@/src/hooks/use-form-status";
import { toFormikValidation } from "@/src/lib/to-formik-validation";
import { trpc } from "@/src/lib/trpc";
import { ScheduleFormPresentation } from "./form-presentation";

function toLocalInput(value: Date | string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function ScheduleFormContainer({
  campaignId,
  scheduleId,
}: {
  campaignId?: string;
  scheduleId?: string;
}) {
  const router = useRouter();
  const { status, setError, reset } = useFormStatus();
  const schedule = trpc.campaign.getSchedule.useQuery(
    { id: scheduleId ?? "" },
    { enabled: Boolean(scheduleId) },
  );
  const campaigns = trpc.campaign.list.useQuery({
    status: "PUBLISHED",
    limit: 100,
    offset: 0,
  });
  const groups = trpc.targetGroup.list.useQuery({
    limit: 100,
    offset: 0,
    filters: { status: "ACTIVE" },
  });
  const create = trpc.campaign.createSchedule.useMutation();
  const update = trpc.campaign.updateSchedule.useMutation();
  const row = schedule.data;
  const campaignRows = campaigns.data?.rows ?? [];

  const initialValues: ScheduleFormValues = {
    name: row?.name ?? "",
    type: row?.type ?? "ONE_TIME",
    sourceCampaignIds:
      row?.sources.map((source) => source.campaignId) ??
      (campaignId ? [campaignId] : []),
    targetGroupId: row?.targetGroupId ?? null,
    targetTimezone:
      row?.targetTimezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    startsAt: toLocalInput(row?.startsAt ?? null) ?? "",
    frequency: row?.frequency ?? null,
    localTimeMinutes: row?.localTimeMinutes ?? null,
    weekday: row?.weekday ?? null,
    dayOfMonth: row?.dayOfMonth ?? null,
    month: row?.month ?? null,
    selectionStrategy: row?.selectionStrategy ?? null,
    shuffleDeck: row?.shuffleDeck ?? false,
    deliveryMode: row?.deliveryMode ?? "BLAST",
    dripEmailsPerMinute: row?.dripEmailsPerMinute ?? null,
    batchSize: row?.batchSize ?? null,
    batchIntervalMinutes: row?.batchIntervalMinutes ?? null,
    maxCampaigns: row?.maxCampaigns ?? null,
    endsAt: toLocalInput(row?.endsAt ?? null),
    autoCompleteAfterDays: row ? row.autoCompleteAfterDays : 20,
  };

  function validate(values: ScheduleFormValues) {
    const errors = toFormikValidation(scheduleFormSchema)(values);
    const sourceIds = new Set(values.sourceCampaignIds);
    const usesTemplate = campaignRows.some(
      (campaign) => sourceIds.has(campaign.id) && campaign.type === "TEMPLATE",
    );
    if (usesTemplate && !values.targetGroupId) {
      errors.targetGroupId = "Select a target group for template schedules";
    }
    return errors;
  }

  async function submit(values: ScheduleFormValues) {
    reset();
    try {
      const recurring = values.type === "RECURRING";
      const payload = {
        ...values,
        startsAt: new Date(values.startsAt),
        endsAt: values.endsAt ? new Date(values.endsAt) : null,
        maxCampaigns: recurring ? values.maxCampaigns : null,
        frequency: recurring ? values.frequency : null,
        selectionStrategy: recurring ? values.selectionStrategy : null,
        localTimeMinutes: recurring ? values.localTimeMinutes : null,
        weekday: recurring ? values.weekday : null,
        dayOfMonth: recurring ? values.dayOfMonth : null,
        month: recurring ? values.month : null,
        shuffleDeck: recurring ? values.shuffleDeck : false,
      };

      if (scheduleId) {
        await update.mutateAsync({ id: scheduleId, data: payload });
        router.push(`/schedule/${scheduleId}?saved=updated`);
      } else {
        const result = await create.mutateAsync(payload);
        router.push(`/schedule/${result.schedule.id}?saved=created`);
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Schedule could not be saved",
      );
    }
  }

  if (schedule.isLoading || campaigns.isLoading || groups.isLoading)
    return <FormSkeleton />;
  if (scheduleId && !row)
    return <p className="p-8 text-zinc-400">Schedule not found.</p>;

  return (
    <div className="px-6 py-8">
      <div className="mb-6">
        <BreadCrumb
          home={{ icon: "pi pi-home", url: "/" }}
          model={[
            { label: "Schedule", url: "/schedule" },
            { label: scheduleId ? "Edit schedule" : "New schedule" },
          ]}
        />
        <h1 className="mt-2 text-2xl font-semibold text-white">
          {scheduleId ? "Edit schedule" : "Create schedule"}
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Configure campaign sources, timing, delivery, and completion.
        </p>
      </div>
      <Formik
        initialValues={initialValues}
        validateOnChange={false}
        validate={validate}
        onSubmit={submit}
      >
        <ScheduleFormPresentation
          campaigns={campaignRows.map(({ id, name, type }) => ({
            id,
            name,
            type,
          }))}
          targetGroups={groups.data?.targetGroups ?? []}
          error={status.type === "error" ? status.message : ""}
          onCancel={() =>
            router.push(scheduleId ? `/schedule/${scheduleId}` : "/schedule")
          }
        />
      </Formik>
    </div>
  );
}
