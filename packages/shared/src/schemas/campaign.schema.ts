import { z } from "zod";

const timezoneValidity = new Map<string, boolean>();

const isIanaTimezone = (value: string) => {
  const cached = timezoneValidity.get(value);
  if (cached !== undefined) return cached;

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    timezoneValidity.set(value, true);
    return true;
  } catch {
    timezoneValidity.set(value, false);
    return false;
  }
};

export const campaignFormSchema = z
  .object({
    name: z.string().trim().min(1, "Campaign name is required").max(200),
    tags: z.array(z.string().trim().min(1).max(50)).max(20),
    type: z.enum(["TEMPLATE", "CONCRETE"]),
    status: z.enum(["DRAFT", "PUBLISHED"]),
    emailTemplateId: z.string().min(1, "Select an email template"),
    pageId: z.string().min(1, "Select a landing page"),
    mailSendingProfileId: z.string().min(1, "Select a sending profile"),
    targetGroupId: z.string().nullable(),
    targetTimezone: z
      .string()
      .trim()
      .refine(isIanaTimezone, "Enter a valid IANA timezone"),
    automaticallyComplete: z.boolean(),
    autoCompleteAfterDays: z.number().int().positive().nullable(),
    scheduleEnabled: z.boolean(),
    scheduleName: z.string().trim().max(200),
    scheduleStartsAt: z.string(),
    scheduleTargetTimezone: z.string().trim(),
    scheduleDeliveryMode: z.enum(["BLAST", "DRIP", "BATCH"]),
    scheduleDripEmailsPerMinute: z.number().int().positive().nullable(),
    scheduleBatchSize: z.number().int().positive().nullable(),
    scheduleBatchIntervalMinutes: z.number().int().positive().nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.type === "CONCRETE" && !value.targetGroupId)
      ctx.addIssue({
        code: "custom",
        path: ["targetGroupId"],
        message: "Concrete campaigns require a target group",
      });
    if (value.automaticallyComplete && !value.autoCompleteAfterDays)
      ctx.addIssue({
        code: "custom",
        path: ["autoCompleteAfterDays"],
        message: "Completion duration is required",
      });
    if (value.type !== "CONCRETE" && value.scheduleEnabled)
      ctx.addIssue({
        code: "custom",
        path: ["scheduleEnabled"],
        message: "Only concrete campaigns can be scheduled directly",
      });
    if (value.scheduleEnabled) {
      if (value.status !== "PUBLISHED")
        ctx.addIssue({
          code: "custom",
          path: ["status"],
          message: "Publish the campaign before scheduling it",
        });
      if (!value.scheduleName)
        ctx.addIssue({
          code: "custom",
          path: ["scheduleName"],
          message: "Schedule name is required",
        });
      if (!value.scheduleStartsAt)
        ctx.addIssue({
          code: "custom",
          path: ["scheduleStartsAt"],
          message: "Schedule start is required",
        });
      if (!isIanaTimezone(value.scheduleTargetTimezone))
        ctx.addIssue({
          code: "custom",
          path: ["scheduleTargetTimezone"],
          message: "Enter a valid IANA timezone",
        });
      if (
        value.scheduleDeliveryMode === "DRIP" &&
        !value.scheduleDripEmailsPerMinute
      )
        ctx.addIssue({
          code: "custom",
          path: ["scheduleDripEmailsPerMinute"],
          message: "Emails per minute is required",
        });
      if (
        value.scheduleDeliveryMode === "BATCH" &&
        (!value.scheduleBatchSize || !value.scheduleBatchIntervalMinutes)
      )
        ctx.addIssue({
          code: "custom",
          path: ["scheduleBatchSize"],
          message: "Batch size and interval are required",
        });
    }
  });

export const scheduleFormSchema = z
  .object({
    name: z.string().trim().min(1, "Schedule name is required").max(200),
    type: z.enum(["ONE_TIME", "RECURRING"]),
    sourceCampaignIds: z.array(z.string()).min(1, "Select a campaign source"),
    targetGroupId: z.string().nullable(),
    targetTimezone: z
      .string()
      .trim()
      .refine(isIanaTimezone, "Enter a valid IANA timezone"),
    startsAt: z.string().min(1, "Start time is required"),
    frequency: z
      .enum(["WEEKLY", "MONTHLY", "QUARTERLY", "HALF_YEARLY", "YEARLY"])
      .nullable(),
    localTimeMinutes: z.number().int().min(0).max(1439).nullable(),
    weekday: z.number().int().min(0).max(6).nullable(),
    dayOfMonth: z.number().int().min(1).max(31).nullable(),
    month: z.number().int().min(1).max(12).nullable(),
    selectionStrategy: z.enum(["DECK", "RANDOM"]).nullable(),
    shuffleDeck: z.boolean(),
    deliveryMode: z.enum(["BLAST", "DRIP", "BATCH"]),
    dripEmailsPerMinute: z.number().int().positive().nullable(),
    batchSize: z.number().int().positive().nullable(),
    batchIntervalMinutes: z.number().int().positive().nullable(),
    maxCampaigns: z.number().int().positive().nullable(),
    endsAt: z.string().nullable(),
    autoCompleteAfterDays: z.number().int().positive().nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.type === "ONE_TIME" && value.sourceCampaignIds.length !== 1)
      ctx.addIssue({
        code: "custom",
        path: ["sourceCampaignIds"],
        message: "One-time schedules require exactly one source",
      });
    if (value.type === "RECURRING") {
      if (!value.targetGroupId)
        ctx.addIssue({
          code: "custom",
          path: ["targetGroupId"],
          message: "Select a target group for template schedules",
        });
      if (!value.frequency || !value.selectionStrategy)
        ctx.addIssue({
          code: "custom",
          path: ["frequency"],
          message: "Select a frequency and strategy",
        });
      if (value.localTimeMinutes === null)
        ctx.addIssue({
          code: "custom",
          path: ["localTimeMinutes"],
          message: "Select a local recurrence time",
        });
      if (value.frequency === "WEEKLY" && value.weekday === null)
        ctx.addIssue({
          code: "custom",
          path: ["weekday"],
          message: "Select a weekday",
        });
      if (
        value.frequency &&
        value.frequency !== "WEEKLY" &&
        value.dayOfMonth === null
      )
        ctx.addIssue({
          code: "custom",
          path: ["dayOfMonth"],
          message: "Select a day of month",
        });
    }
    if (value.deliveryMode === "DRIP" && !value.dripEmailsPerMinute)
      ctx.addIssue({
        code: "custom",
        path: ["dripEmailsPerMinute"],
        message: "Enter an emails-per-minute rate",
      });
    if (
      value.deliveryMode === "BATCH" &&
      (!value.batchSize || !value.batchIntervalMinutes)
    )
      ctx.addIssue({
        code: "custom",
        path: ["batchSize"],
        message: "Enter a batch size and interval",
      });
  });

export type CampaignFormValues = z.infer<typeof campaignFormSchema>;
export type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;
