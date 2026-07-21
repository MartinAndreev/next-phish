import { Container } from "@/src/server/container";
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
  CreateScheduleSchema,
  UpdateScheduleSchema,
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
});
