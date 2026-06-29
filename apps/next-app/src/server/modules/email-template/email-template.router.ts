import { Container } from "@/src/server/container";
import {
  MessageBus,
  GetEmailTemplatesQuery,
  GetEmailTemplateByIdQuery,
  CreateEmailTemplateCommand,
  UpdateEmailTemplateCommand,
  DeleteEmailTemplateCommand,
  GetEmailTemplatesSchema,
  GetEmailTemplateByIdSchema,
  CreateEmailTemplateCommandSchema,
  UpdateEmailTemplateCommandSchema,
  DeleteEmailTemplateCommandSchema,
} from "@next-phish/backend";
import { createPermissionProcedure, router } from "../../trpc/procedures";

const bus = Container.get(MessageBus);

const readProcedure = createPermissionProcedure({
  "email-templates": ["read"],
});

const writeProcedure = createPermissionProcedure({
  "email-templates": ["write"],
});

export const emailTemplateRouter = router({
  list: readProcedure
    .input(GetEmailTemplatesSchema)
    .query(async ({ ctx, input }) => {
      const handler = Container.get(GetEmailTemplatesQuery);
      return bus.query(handler, {
        ...input,
        organizationId: ctx.activeOrganizationId,
      });
    }),

  getById: readProcedure
    .input(GetEmailTemplateByIdSchema)
    .query(async ({ ctx, input }) => {
      const handler = Container.get(GetEmailTemplateByIdQuery);
      return bus.query(handler, {
        id: input.id,
        organizationId: ctx.activeOrganizationId,
      });
    }),

  create: writeProcedure
    .input(CreateEmailTemplateCommandSchema)
    .mutation(async ({ ctx, input }) => {
      const handler = Container.get(CreateEmailTemplateCommand);
      return bus.dispatch(handler, {
        ...input,
        organizationId: ctx.activeOrganizationId,
        createdById: ctx.userId,
      });
    }),

  update: writeProcedure
    .input(UpdateEmailTemplateCommandSchema)
    .mutation(async ({ ctx, input }) => {
      const handler = Container.get(UpdateEmailTemplateCommand);
      return bus.dispatch(handler, {
        id: input.id,
        organizationId: ctx.activeOrganizationId,
        data: {
          name: input.name,
          tags: input.tags,
          html: input.html,
          design: input.design,
          status: input.status,
          trackingPixel: input.trackingPixel,
          fileIds: input.fileIds,
        },
      });
    }),

  delete: writeProcedure
    .input(DeleteEmailTemplateCommandSchema)
    .mutation(async ({ ctx, input }) => {
      const handler = Container.get(DeleteEmailTemplateCommand);
      return bus.dispatch(handler, {
        id: input.id,
        organizationId: ctx.activeOrganizationId,
      });
    }),
});
