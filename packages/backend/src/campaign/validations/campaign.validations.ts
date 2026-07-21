import { z } from "zod";

function isIanaTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

const timezoneSchema = z
  .string()
  .trim()
  .min(1)
  .refine(isIanaTimezone, "A valid IANA timezone is required");

export const campaignTypeSchema = z.enum(["TEMPLATE", "CONCRETE"]);
export const campaignStatusSchema = z.enum([
  "DRAFT",
  "PUBLISHED",
  "SCHEDULED",
  "PENDING_START",
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
  "FAILED",
]);

const campaignDefinitionSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    tags: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
    type: campaignTypeSchema,
    status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
    emailTemplateId: z.string().min(1),
    pageId: z.string().min(1),
    mailSendingProfileId: z.string().min(1),
    targetGroupId: z.string().min(1).nullable(),
    targetTimezone: timezoneSchema,
    autoCompleteAfterDays: z.number().int().positive().nullable().default(20),
  })
  .superRefine((value, ctx) => {
    if (value.type === "TEMPLATE" && value.targetGroupId !== null) {
      ctx.addIssue({
        code: "custom",
        path: ["targetGroupId"],
        message: "Templates cannot select a target group",
      });
    }
    if (value.type === "CONCRETE" && value.targetGroupId === null) {
      ctx.addIssue({
        code: "custom",
        path: ["targetGroupId"],
        message: "Concrete campaigns require a target group",
      });
    }
  });

const campaignSortSchema = z.object({
  field: z.enum(["name", "type", "status", "createdAt", "updatedAt"]),
  order: z.enum(["asc", "desc"]),
});

export const ListCampaignsSchema = z.object({
  type: campaignTypeSchema.optional(),
  status: campaignStatusSchema.optional(),
  search: z.string().trim().optional(),
  sort: z.array(campaignSortSchema).optional(),
  filters: z
    .object({
      type: campaignTypeSchema.optional(),
      status: campaignStatusSchema.optional(),
    })
    .optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});
export const CampaignIdSchema = z.object({ id: z.string().min(1) });
export const CreateCampaignSchema = campaignDefinitionSchema;
export const UpdateCampaignSchema = z.object({
  id: z.string().min(1),
  data: campaignDefinitionSchema,
});
export const CloneCampaignSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().trim().min(1).max(200),
    type: campaignTypeSchema,
    targetGroupId: z.string().min(1).nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.type === "TEMPLATE" && value.targetGroupId !== null)
      ctx.addIssue({
        code: "custom",
        path: ["targetGroupId"],
        message: "Templates cannot select a target group",
      });
    if (value.type === "CONCRETE" && value.targetGroupId === null)
      ctx.addIssue({
        code: "custom",
        path: ["targetGroupId"],
        message: "Concrete campaigns require a target group",
      });
  });

export const deliveryModeSchema = z.enum(["BLAST", "DRIP", "BATCH"]);
const scheduleDefinitionSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    type: z.enum(["ONE_TIME", "RECURRING"]),
    sourceCampaignIds: z.array(z.string().min(1)).min(1),
    targetGroupId: z.string().min(1).nullable(),
    targetTimezone: timezoneSchema,
    startsAt: z.coerce.date(),
    frequency: z
      .enum(["WEEKLY", "MONTHLY", "QUARTERLY", "HALF_YEARLY", "YEARLY"])
      .nullable()
      .default(null),
    localTimeMinutes: z
      .number()
      .int()
      .min(0)
      .max(1439)
      .nullable()
      .default(null),
    weekday: z.number().int().min(0).max(6).nullable().default(null),
    dayOfMonth: z.number().int().min(1).max(31).nullable().default(null),
    month: z.number().int().min(1).max(12).nullable().default(null),
    selectionStrategy: z.enum(["DECK", "RANDOM"]).nullable().default(null),
    shuffleDeck: z.boolean().default(false),
    deliveryMode: deliveryModeSchema,
    dripEmailsPerMinute: z.number().int().positive().nullable().default(null),
    batchSize: z.number().int().positive().nullable().default(null),
    batchIntervalMinutes: z.number().int().positive().nullable().default(null),
    maxCampaigns: z.number().int().positive().nullable().default(null),
    endsAt: z.coerce.date().nullable().default(null),
    autoCompleteAfterDays: z.number().int().positive().nullable().default(20),
  })
  .superRefine((value, ctx) => {
    if (value.type === "ONE_TIME") {
      if (value.sourceCampaignIds.length !== 1)
        ctx.addIssue({
          code: "custom",
          path: ["sourceCampaignIds"],
          message: "One-time schedules require exactly one source",
        });
      for (const field of [
        "frequency",
        "selectionStrategy",
        "localTimeMinutes",
        "weekday",
        "dayOfMonth",
        "month",
      ] as const) {
        if (value[field] !== null)
          ctx.addIssue({
            code: "custom",
            path: [field],
            message: `${field} is only valid for recurring schedules`,
          });
      }
    } else {
      if (!value.frequency || !value.selectionStrategy)
        ctx.addIssue({
          code: "custom",
          path: ["frequency"],
          message: "Recurring schedules require frequency and strategy",
        });
      if (value.localTimeMinutes === null)
        ctx.addIssue({
          code: "custom",
          path: ["localTimeMinutes"],
          message: "Recurring schedules require a local time",
        });
      if (value.frequency === "WEEKLY" && value.weekday === null)
        ctx.addIssue({
          code: "custom",
          path: ["weekday"],
          message: "Weekly schedules require a weekday",
        });
      if (
        value.frequency &&
        value.frequency !== "WEEKLY" &&
        value.dayOfMonth === null
      )
        ctx.addIssue({
          code: "custom",
          path: ["dayOfMonth"],
          message: "This frequency requires a day of month",
        });
      if (
        ["QUARTERLY", "HALF_YEARLY", "YEARLY"].includes(
          value.frequency ?? "",
        ) &&
        value.month === null
      )
        ctx.addIssue({
          code: "custom",
          path: ["month"],
          message: "This frequency requires a month",
        });
      if (value.frequency === "QUARTERLY" && (value.month ?? 0) > 3)
        ctx.addIssue({
          code: "custom",
          path: ["month"],
          message: "Quarterly month must be between 1 and 3",
        });
      if (value.frequency === "HALF_YEARLY" && (value.month ?? 0) > 6)
        ctx.addIssue({
          code: "custom",
          path: ["month"],
          message: "Half-yearly month must be between 1 and 6",
        });
    }
    if (value.deliveryMode === "BLAST") {
      if (value.dripEmailsPerMinute !== null)
        ctx.addIssue({
          code: "custom",
          path: ["dripEmailsPerMinute"],
          message: "Blast does not use a drip rate",
        });
      if (value.batchSize !== null || value.batchIntervalMinutes !== null)
        ctx.addIssue({
          code: "custom",
          path: ["batchSize"],
          message: "Blast does not use batch settings",
        });
    }
    if (value.deliveryMode === "DRIP") {
      if (!value.dripEmailsPerMinute)
        ctx.addIssue({
          code: "custom",
          path: ["dripEmailsPerMinute"],
          message: "Drip rate is required",
        });
      if (value.batchSize !== null || value.batchIntervalMinutes !== null)
        ctx.addIssue({
          code: "custom",
          path: ["batchSize"],
          message: "Drip does not use batch settings",
        });
    }
    if (value.deliveryMode === "BATCH") {
      if (!value.batchSize || !value.batchIntervalMinutes)
        ctx.addIssue({
          code: "custom",
          path: ["batchSize"],
          message: "Batch size and interval are required",
        });
      if (value.dripEmailsPerMinute !== null)
        ctx.addIssue({
          code: "custom",
          path: ["dripEmailsPerMinute"],
          message: "Batch does not use a drip rate",
        });
    }
    if (value.endsAt && value.endsAt <= value.startsAt)
      ctx.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "End date must follow start date",
      });
  });

export const ListSchedulesSchema = z.object({
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});
export const CreateScheduleSchema = scheduleDefinitionSchema;
export const UpdateScheduleSchema = z.object({
  id: z.string().min(1),
  data: scheduleDefinitionSchema,
});
export const MaterializeOccurrenceSchema = z.object({
  scheduleId: z.string().min(1),
  sourceCampaignId: z.string().min(1),
  occurrenceAt: z.coerce.date(),
});

export const CampaignLifecycleSchema = z.object({ id: z.string().min(1) });

export type CampaignDefinitionInput = z.infer<typeof CreateCampaignSchema>;
export type ScheduleDefinitionInput = z.infer<typeof CreateScheduleSchema>;
