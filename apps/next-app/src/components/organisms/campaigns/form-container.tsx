"use client";

import { Formik } from "formik";
import { useRouter } from "next/navigation";
import { BreadCrumb } from "primereact/breadcrumb";
import {
  campaignFormSchema,
  type CampaignFormValues,
} from "@next-phish/shared";
import { FormSkeleton } from "@/src/components/atoms/form-skeleton";
import { useCampaignAuthoring } from "@/src/hooks/use-campaign-authoring";
import { useFormStatus } from "@/src/hooks/use-form-status";
import { toFormikValidation } from "@/src/lib/to-formik-validation";
import { CampaignFormPresentation } from "./form-presentation";

function toLocalInput(value: Date | string): string {
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function CampaignFormContainer({ campaignId }: { campaignId?: string }) {
  const router = useRouter();
  const { status, setError, reset } = useFormStatus();
  const authoring = useCampaignAuthoring(campaignId);
  const {
    campaign,
    isLoading,
    create,
    update,
    createSchedule,
    updateSchedule,
  } = authoring;

  if (isLoading) return <FormSkeleton />;
  if (campaignId && !campaign.data)
    return <p className="p-8 text-zinc-400">Campaign not found.</p>;

  const row = campaign.data;
  const existingSchedule = row?.scheduleSources
    .map((source) => source.schedule)
    .find((schedule) => !["COMPLETED", "CANCELLED"].includes(schedule.status));
  const defaultTimezone =
    row?.targetTimezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const initialValues: CampaignFormValues = {
    name: row?.name ?? "",
    tags: row?.tags ?? [],
    type: row?.type ?? "CONCRETE",
    status:
      (row?.type ?? "CONCRETE") === "CONCRETE" || row?.status === "PUBLISHED"
        ? "PUBLISHED"
        : "DRAFT",
    emailTemplateId: row?.emailTemplateId ?? "",
    pageId: row?.pageId ?? "",
    mailSendingProfileId: row?.mailSendingProfileId ?? "",
    targetGroupId: row?.targetGroupId ?? null,
    targetTimezone: defaultTimezone,
    automaticallyComplete: row?.autoCompleteAfterDays !== null,
    autoCompleteAfterDays: row?.autoCompleteAfterDays ?? 20,
    scheduleEnabled:
      (row?.type ?? "CONCRETE") === "CONCRETE" || Boolean(existingSchedule),
    scheduleName: row?.name ?? existingSchedule?.name ?? "Campaign",
    scheduleStartsAt: toLocalInput(existingSchedule?.startsAt ?? new Date()),
    scheduleTargetTimezone: existingSchedule?.targetTimezone ?? defaultTimezone,
    scheduleDeliveryMode: existingSchedule?.deliveryMode ?? "BLAST",
    scheduleDripEmailsPerMinute: existingSchedule?.dripEmailsPerMinute ?? null,
    scheduleBatchSize: existingSchedule?.batchSize ?? null,
    scheduleBatchIntervalMinutes:
      existingSchedule?.batchIntervalMinutes ?? null,
  };

  async function submit(values: CampaignFormValues) {
    reset();
    const campaignPayload = {
      name: values.name,
      tags: values.tags,
      type: values.type,
      status: values.status,
      emailTemplateId: values.emailTemplateId,
      pageId: values.pageId,
      mailSendingProfileId: values.mailSendingProfileId,
      targetGroupId: values.type === "TEMPLATE" ? null : values.targetGroupId,
      targetTimezone: values.targetTimezone,
      autoCompleteAfterDays: values.automaticallyComplete
        ? values.autoCompleteAfterDays
        : null,
    };

    try {
      const saved = campaignId
        ? await update.mutateAsync({ id: campaignId, data: campaignPayload })
        : await create.mutateAsync(campaignPayload);

      if (values.type === "CONCRETE" && values.scheduleEnabled) {
        const schedulePayload = {
          name: values.name,
          type: "ONE_TIME" as const,
          sourceCampaignIds: [saved.id],
          targetGroupId: saved.targetGroupId,
          targetTimezone: values.scheduleTargetTimezone,
          startsAt: new Date(values.scheduleStartsAt),
          frequency: null,
          localTimeMinutes: null,
          weekday: null,
          dayOfMonth: null,
          month: null,
          selectionStrategy: null,
          shuffleDeck: false,
          deliveryMode: values.scheduleDeliveryMode,
          dripEmailsPerMinute:
            values.scheduleDeliveryMode === "DRIP"
              ? values.scheduleDripEmailsPerMinute
              : null,
          batchSize:
            values.scheduleDeliveryMode === "BATCH"
              ? values.scheduleBatchSize
              : null,
          batchIntervalMinutes:
            values.scheduleDeliveryMode === "BATCH"
              ? values.scheduleBatchIntervalMinutes
              : null,
          maxCampaigns: null,
          endsAt: null,
          autoCompleteAfterDays: campaignPayload.autoCompleteAfterDays,
        };
        if (existingSchedule)
          await updateSchedule.mutateAsync({
            id: existingSchedule.id,
            data: schedulePayload,
          });
        else await createSchedule.mutateAsync(schedulePayload);
      }

      router.push(
        `/campaigns/${saved.id}?saved=${campaignId ? "updated" : "created"}`,
      );
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Campaign could not be saved",
      );
    }
  }

  return (
    <div className="px-6 py-8">
      <div className="mb-6">
        <BreadCrumb
          home={{ icon: "pi pi-home", url: "/" }}
          model={[
            { label: "Campaigns", url: "/campaigns" },
            { label: campaignId ? "Edit campaign" : "New campaign" },
          ]}
        />
        <h1 className="mt-2 text-2xl font-semibold text-white">
          {campaignId ? "Edit campaign" : "Create campaign"}
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Configure campaign assets, delivery identity, and optional scheduling.
        </p>
      </div>
      <Formik
        initialValues={initialValues}
        validateOnChange={false}
        validate={toFormikValidation(campaignFormSchema)}
        onSubmit={submit}
      >
        <CampaignFormPresentation
          isEdit={Boolean(campaignId)}
          emailTemplates={authoring.emailTemplates}
          emailTemplatesTotal={authoring.emailTemplatesTotal}
          emailTemplatesLoading={authoring.emailTemplatesLoading}
          emailTemplateCatalogState={authoring.emailTemplateCatalogState}
          setEmailTemplateSearch={authoring.setEmailTemplateSearch}
          setEmailTemplatePage={authoring.setEmailTemplatePage}
          pages={authoring.pages}
          pagesTotal={authoring.pagesTotal}
          pagesLoading={authoring.pagesLoading}
          pageCatalogState={authoring.pageCatalogState}
          setPageSearch={authoring.setPageSearch}
          setPagePage={authoring.setPagePage}
          sendingProfiles={authoring.sendingProfiles}
          sendingProfilesLoading={authoring.sendingProfilesLoading}
          sendingProfileSearch={authoring.sendingProfileSearch}
          setSendingProfileSearch={authoring.setSendingProfileSearch}
          targetGroups={authoring.targetGroups}
          hasExistingSchedule={Boolean(existingSchedule)}
          error={status.type === "error" ? status.message : ""}
          onCancel={() => router.push("/campaigns")}
        />
      </Formik>
    </div>
  );
}
