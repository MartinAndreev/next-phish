import { z } from "zod";
import { Container } from "@/src/server/container";
import {
  MessageBus,
  GetPagesQuery,
  GetPageByIdQuery,
  CreatePageCommand,
  UpdatePageCommand,
  DeletePageCommand,
  CreatePageSubmissionCommand,
  CreateSiteImportCommand,
  GetSiteImportByJobIdQuery,
  ListSiteImportsQuery,
  GetJobByIdQuery,
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
  protectedProcedure,
  publicProcedure,
  router,
} from "../../trpc/procedures";
import { jobQueue } from "../../queue";

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
    .mutation(async ({ ctx, input }) => {
      const handler = Container.get(CreateSiteImportCommand);
      const result = await bus.dispatch(handler, {
        url: input.url,
        includeAssets: input.includeAssets,
        organizationId: ctx.activeOrganizationId,
        createdById: ctx.session.user.id,
      });

      await jobQueue.add(
        "site_import",
        { jobId: result.jobId },
        {
          attempts: 1,
          removeOnComplete: { age: 3600 },
          removeOnFail: { age: 86400 },
        },
      );

      return result;
    }),

  importStatus: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ input }) => {
      const jobHandler = Container.get(GetJobByIdQuery);
      const siteImportHandler = Container.get(GetSiteImportByJobIdQuery);

      const [job, siteImport] = await Promise.all([
        bus.query(jobHandler, { id: input.jobId }),
        bus.query(siteImportHandler, { jobId: input.jobId }),
      ]);

      return {
        job,
        siteImport,
      };
    }),

  listImports: activeOrganizationProcedure
    .input(
      z.object({ limit: z.number().min(1).max(50).default(20) }).optional(),
    )
    .query(async ({ ctx, input }) => {
      const handler = Container.get(ListSiteImportsQuery);
      return bus.query(handler, {
        organizationId: ctx.activeOrganizationId,
        limit: input?.limit,
      });
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
