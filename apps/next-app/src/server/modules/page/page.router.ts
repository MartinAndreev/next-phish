import { Container } from "@/src/server/container";
import {
  MessageBus,
  GetPagesQuery,
  GetPageByIdQuery,
  CreatePageCommand,
  UpdatePageCommand,
  DeletePageCommand,
  CreatePageSubmissionCommand,
  GetPagesSchema,
  GetPageByIdSchema,
  CreatePageCommandSchema,
  UpdatePageCommandSchema,
  DeletePageCommandSchema,
  ImportPageFromUrlSchema,
  CreatePageSubmissionSchema,
} from "@next-phish/backend";
import {
  activeOrganizationProcedure,
  publicProcedure,
  router,
} from "../../trpc/procedures";

const bus = Container.get(MessageBus);

export const pageRouter = router({
  list: activeOrganizationProcedure
    .input(GetPagesSchema)
    .query(async ({ ctx, input }) => {
      const handler = Container.get(GetPagesQuery);
      return bus.query(handler, {
        ...input,
        organizationId: ctx.activeOrganizationId,
      });
    }),

  getById: activeOrganizationProcedure
    .input(GetPageByIdSchema)
    .query(async ({ ctx, input }) => {
      const handler = Container.get(GetPageByIdQuery);
      return bus.query(handler, {
        id: input.id,
        organizationId: ctx.activeOrganizationId,
      });
    }),

  create: activeOrganizationProcedure
    .input(CreatePageCommandSchema)
    .mutation(async ({ ctx, input }) => {
      const handler = Container.get(CreatePageCommand);
      return bus.dispatch(handler, {
        ...input,
        organizationId: ctx.activeOrganizationId,
        createdById: ctx.session.user.id,
      });
    }),

  update: activeOrganizationProcedure
    .input(UpdatePageCommandSchema)
    .mutation(async ({ ctx, input }) => {
      const handler = Container.get(UpdatePageCommand);
      return bus.dispatch(handler, {
        id: input.id,
        organizationId: ctx.activeOrganizationId,
        data: {
          name: input.name,
          type: input.type,
          html: input.html,
          design: input.design,
          status: input.status,
          captureData: input.captureData,
          redirectUrl: input.redirectUrl ?? null,
          redirectPageId: input.redirectPageId ?? null,
        },
      });
    }),

  delete: activeOrganizationProcedure
    .input(DeletePageCommandSchema)
    .mutation(async ({ ctx, input }) => {
      const handler = Container.get(DeletePageCommand);
      return bus.dispatch(handler, {
        id: input.id,
        organizationId: ctx.activeOrganizationId,
      });
    }),

  importFromUrl: activeOrganizationProcedure
    .input(ImportPageFromUrlSchema)
    .mutation(async ({ input }) => {
      const response = await fetch(input.url, {
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch URL: ${response.status} ${response.statusText}`,
        );
      }

      const html = await response.text();
      return { html };
    }),

  submit: publicProcedure
    .input(CreatePageSubmissionSchema)
    .mutation(async ({ ctx, input }) => {
      const handler = Container.get(CreatePageSubmissionCommand);
      return bus.dispatch(handler, {
        pageId: input.pageId,
        data: input.data,
        ipAddress: ctx.headers?.get("x-forwarded-for") ?? null,
        userAgent: ctx.headers?.get("user-agent") ?? null,
      });
    }),
});
