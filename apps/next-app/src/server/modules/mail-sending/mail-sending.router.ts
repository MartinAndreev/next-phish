import { Container } from "@/src/server/container";
import {
  MessageBus,
  GetMailSendingProfilesQuery,
  GetMailSendingProfileByIdQuery,
  CreateMailSendingProfileCommand,
  UpdateMailSendingProfileCommand,
  DeleteMailSendingProfileCommand,
  SendTestEmailCommand,
  VerifyConnectionCommand,
  MailProviderRegistry,
  GetMailSendingProfilesSchema,
  GetMailSendingProfileByIdSchema,
  CreateMailSendingProfileSchema,
  UpdateMailSendingProfileSchema,
  DeleteMailSendingProfileSchema,
  SendTestEmailSchema,
  VerifyConnectionSchema,
} from "@next-phish/backend";
import { createPermissionProcedure, router } from "../../trpc/procedures";
import { toRouterPermissions } from "@next-phish/shared";

const bus = Container.get(MessageBus);

const readProcedure = createPermissionProcedure(
  toRouterPermissions("mail-sending", "read"),
);

const writeProcedure = createPermissionProcedure(
  toRouterPermissions("mail-sending", "write"),
);

export const mailSendingRouter = router({
  list: readProcedure
    .input(GetMailSendingProfilesSchema)
    .query(async ({ ctx, input }) => {
      const handler = Container.get(GetMailSendingProfilesQuery);
      return bus.query(handler, {
        ...input,
        organizationId: ctx.activeOrganizationId,
      });
    }),

  getById: readProcedure
    .input(GetMailSendingProfileByIdSchema)
    .query(async ({ ctx, input }) => {
      const handler = Container.get(GetMailSendingProfileByIdQuery);
      return bus.query(handler, {
        id: input.id,
        organizationId: ctx.activeOrganizationId,
      });
    }),

  create: writeProcedure
    .input(CreateMailSendingProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const handler = Container.get(CreateMailSendingProfileCommand);
      return bus.dispatch(handler, {
        ...input,
        organizationId: ctx.activeOrganizationId,
      });
    }),

  update: writeProcedure
    .input(UpdateMailSendingProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const handler = Container.get(UpdateMailSendingProfileCommand);
      return bus.dispatch(handler, {
        ...input,
        organizationId: ctx.activeOrganizationId,
      });
    }),

  delete: writeProcedure
    .input(DeleteMailSendingProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const handler = Container.get(DeleteMailSendingProfileCommand);
      return bus.dispatch(handler, {
        id: input.id,
        organizationId: ctx.activeOrganizationId,
      });
    }),

  sendTest: writeProcedure
    .input(SendTestEmailSchema)
    .mutation(async ({ ctx, input }) => {
      const handler = Container.get(SendTestEmailCommand);
      return bus.dispatch(handler, {
        ...input,
        organizationId: ctx.activeOrganizationId,
      });
    }),

  verifyConnection: writeProcedure
    .input(VerifyConnectionSchema)
    .mutation(async ({ ctx, input }) => {
      const handler = Container.get(VerifyConnectionCommand);
      return bus.dispatch(handler, {
        ...input,
        organizationId: ctx.activeOrganizationId,
      });
    }),

  listCapabilities: readProcedure.query(() => {
    const registry = Container.get(MailProviderRegistry);
    return registry.listCapabilities();
  }),
});
