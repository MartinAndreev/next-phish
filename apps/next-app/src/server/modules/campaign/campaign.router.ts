import { Container } from "@/src/server/container";
import { z } from "zod";
import {
  MessageBus,
  ListCampaignsQuery,
  GetCampaignQuery,
  CreateCampaignCommand,
  UpdateCampaignCommand,
  PublishCampaignCommand,
  CloneCampaignCommand,
  ListSchedulesQuery,
  GetScheduleQuery,
  GetScheduleTimelineQuery,
  CreateScheduleCommand,
  UpdateScheduleCommand,
  CancelScheduleCommand,
  PauseCampaignCommand,
  ResumeCampaignCommand,
  CompleteCampaignCommand,
  DuplicateScheduleCommand,
  ListCampaignsSchema,
  CampaignIdSchema,
  CreateCampaignSchema,
  UpdateCampaignSchema,
  CloneCampaignSchema,
  CampaignLifecycleSchema,
  ListSchedulesSchema,
  ScheduleTimelineSchema,
  CreateScheduleSchema,
  UpdateScheduleSchema,
  DeliveryRepository,
} from "@next-phish/backend";
import { toRouterPermissions } from "@next-phish/shared";
import { createPermissionProcedure, router } from "../../trpc/procedures";

const bus = Container.get(MessageBus);
const readProcedure = createPermissionProcedure(
  toRouterPermissions("campaigns", "read"),
);
const writeProcedure = createPermissionProcedure(
  toRouterPermissions("campaigns", "write"),
);

export const campaignRouter = router({
  list: readProcedure.input(ListCampaignsSchema).query(({ ctx, input }) =>
    bus.query(Container.get(ListCampaignsQuery), {
      ...input,
      organizationId: ctx.activeOrganizationId,
    }),
  ),
  getById: readProcedure.input(CampaignIdSchema).query(({ ctx, input }) =>
    bus.query(Container.get(GetCampaignQuery), {
      ...input,
      organizationId: ctx.activeOrganizationId,
    }),
  ),
  create: writeProcedure
    .input(CreateCampaignSchema)
    .mutation(({ ctx, input }) =>
      bus.dispatch(Container.get(CreateCampaignCommand), {
        ...input,
        organizationId: ctx.activeOrganizationId,
        createdById: ctx.userId,
      }),
    ),
  update: writeProcedure
    .input(UpdateCampaignSchema)
    .mutation(({ ctx, input }) =>
      bus.dispatch(Container.get(UpdateCampaignCommand), {
        ...input,
        organizationId: ctx.activeOrganizationId,
      }),
    ),
  publish: writeProcedure.input(CampaignIdSchema).mutation(({ ctx, input }) =>
    bus.dispatch(Container.get(PublishCampaignCommand), {
      ...input,
      organizationId: ctx.activeOrganizationId,
    }),
  ),
  clone: writeProcedure.input(CloneCampaignSchema).mutation(({ ctx, input }) =>
    bus.dispatch(Container.get(CloneCampaignCommand), {
      ...input,
      organizationId: ctx.activeOrganizationId,
      createdById: ctx.userId,
    }),
  ),
  pause: writeProcedure
    .input(CampaignLifecycleSchema)
    .mutation(({ ctx, input }) =>
      bus.dispatch(Container.get(PauseCampaignCommand), {
        ...input,
        organizationId: ctx.activeOrganizationId,
      }),
    ),
  resume: writeProcedure
    .input(CampaignLifecycleSchema)
    .mutation(({ ctx, input }) =>
      bus.dispatch(Container.get(ResumeCampaignCommand), {
        ...input,
        organizationId: ctx.activeOrganizationId,
      }),
    ),
  complete: writeProcedure
    .input(CampaignLifecycleSchema)
    .mutation(({ ctx, input }) =>
      bus.dispatch(Container.get(CompleteCampaignCommand), {
        ...input,
        organizationId: ctx.activeOrganizationId,
      }),
    ),

  listSchedules: readProcedure
    .input(ListSchedulesSchema)
    .query(({ ctx, input }) =>
      bus.query(Container.get(ListSchedulesQuery), {
        ...input,
        organizationId: ctx.activeOrganizationId,
      }),
    ),
  getSchedule: readProcedure.input(CampaignIdSchema).query(({ ctx, input }) =>
    bus.query(Container.get(GetScheduleQuery), {
      ...input,
      organizationId: ctx.activeOrganizationId,
    }),
  ),
  getScheduleTimeline: readProcedure
    .input(ScheduleTimelineSchema)
    .query(({ ctx, input }) =>
      bus.query(Container.get(GetScheduleTimelineQuery), {
        ...input,
        organizationId: ctx.activeOrganizationId,
      }),
    ),
  createSchedule: writeProcedure
    .input(CreateScheduleSchema)
    .mutation(({ ctx, input }) =>
      bus.dispatch(Container.get(CreateScheduleCommand), {
        ...input,
        organizationId: ctx.activeOrganizationId,
        createdById: ctx.userId,
      }),
    ),
  updateSchedule: writeProcedure
    .input(UpdateScheduleSchema)
    .mutation(({ ctx, input }) =>
      bus.dispatch(Container.get(UpdateScheduleCommand), {
        ...input,
        organizationId: ctx.activeOrganizationId,
      }),
    ),
  cancelSchedule: writeProcedure
    .input(CampaignIdSchema)
    .mutation(({ ctx, input }) =>
      bus.dispatch(Container.get(CancelScheduleCommand), {
        ...input,
        organizationId: ctx.activeOrganizationId,
      }),
    ),
  duplicateSchedule: writeProcedure
    .input(CampaignIdSchema)
    .mutation(({ ctx, input }) =>
      bus.dispatch(Container.get(DuplicateScheduleCommand), {
        ...input,
        organizationId: ctx.activeOrganizationId,
        createdById: ctx.userId,
      }),
    ),

  setDeliveryEnabled: writeProcedure
    .input(
      z.object({ campaignId: z.string().min(1), deliveryEnabled: z.boolean() }),
    )
    .mutation(({ ctx, input }) =>
      Container.get(DeliveryRepository).setCampaignDeliveryEnabled(
        ctx.activeOrganizationId,
        input.campaignId,
        input.deliveryEnabled,
      ),
    ),

  executionOperations: readProcedure.query(({ ctx }) =>
    Container.get(DeliveryRepository).getExecutionOperations(
      ctx.activeOrganizationId,
    ),
  ),

  executionSummary: readProcedure
    .input(z.object({ campaignId: z.string().min(1) }))
    .query(({ ctx, input }) =>
      Container.get(DeliveryRepository).getCampaignExecutionSummary(
        ctx.activeOrganizationId,
        input.campaignId,
      ),
    ),
  listRecipients: readProcedure
    .input(
      z.object({
        campaignId: z.string().min(1),
        limit: z.number().int().min(1).max(200).default(50),
        offset: z.number().int().min(0).default(0),
      }),
    )
    .query(({ ctx, input }) =>
      Container.get(DeliveryRepository).listCampaignRecipients({
        ...input,
        organizationId: ctx.activeOrganizationId,
      }),
    ),
  listCampaignEvents: readProcedure
    .input(
      z.object({
        campaignId: z.string().min(1),
        campaignRecipientId: z.string().min(1).optional(),
        limit: z.number().int().min(1).max(200).default(50),
        offset: z.number().int().min(0).default(0),
      }),
    )
    .query(({ ctx, input }) =>
      Container.get(DeliveryRepository).listCampaignEvents({
        ...input,
        organizationId: ctx.activeOrganizationId,
      }),
    ),
  listDeliveryEvents: readProcedure
    .input(
      z.object({
        campaignId: z.string().min(1),
        campaignRecipientId: z.string().min(1).optional(),
        limit: z.number().int().min(1).max(200).default(50),
        offset: z.number().int().min(0).default(0),
      }),
    )
    .query(({ ctx, input }) =>
      Container.get(DeliveryRepository).listDeliveryEvents({
        ...input,
        organizationId: ctx.activeOrganizationId,
      }),
    ),
});
