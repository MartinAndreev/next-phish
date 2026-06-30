import { z } from "zod";
import { tracked } from "@trpc/server";
import { Container } from "@/src/server/container";
import {
  MessageBus,
  GetTargetGroupsQuery,
  GetTargetGroupByIdQuery,
  GetTargetGroupUsersQuery,
  CreateTargetGroupCommand,
  UpdateTargetGroupCommand,
  DeleteTargetGroupCommand,
  GetTargetGroupsSchema,
  GetTargetGroupByIdSchema,
  GetTargetGroupUsersSchema,
  CreateTargetGroupCommandSchema,
  UpdateTargetGroupCommandSchema,
  DeleteTargetGroupCommandSchema,
  JobRepository,
  CreateJobCommand,
  TargetGroupRepository,
} from "@next-phish/backend";
import {
  createPermissionProcedure,
  protectedProcedure,
  router,
} from "../../trpc/procedures";
import { jobQueue } from "../../queue";
import { toRouterPermissions } from "@next-phish/shared";

const bus = Container.get(MessageBus);

const readProcedure = createPermissionProcedure(
  toRouterPermissions("target-groups", "read"),
);

const writeProcedure = createPermissionProcedure(
  toRouterPermissions("target-groups", "write"),
);

export const targetGroupRouter = router({
  list: readProcedure
    .input(GetTargetGroupsSchema)
    .query(async ({ ctx, input }) => {
      const handler = Container.get(GetTargetGroupsQuery);
      return bus.query(handler, {
        ...input,
        organizationId: ctx.activeOrganizationId,
      });
    }),

  getById: readProcedure
    .input(GetTargetGroupByIdSchema)
    .query(async ({ ctx, input }) => {
      const handler = Container.get(GetTargetGroupByIdQuery);
      return bus.query(handler, {
        id: input.id,
        organizationId: ctx.activeOrganizationId,
      });
    }),

  getUsers: readProcedure
    .input(GetTargetGroupUsersSchema)
    .query(async ({ input }) => {
      const handler = Container.get(GetTargetGroupUsersQuery);
      return bus.query(handler, input);
    }),

  create: writeProcedure
    .input(CreateTargetGroupCommandSchema)
    .mutation(async ({ ctx, input }) => {
      const handler = Container.get(CreateTargetGroupCommand);
      return bus.dispatch(handler, {
        ...input,
        organizationId: ctx.activeOrganizationId,
        createdById: ctx.userId,
      });
    }),

  update: writeProcedure
    .input(UpdateTargetGroupCommandSchema)
    .mutation(async ({ ctx, input }) => {
      const handler = Container.get(UpdateTargetGroupCommand);
      return bus.dispatch(handler, {
        id: input.id,
        organizationId: ctx.activeOrganizationId,
        data: {
          name: input.name,
          status: input.status,
        },
      });
    }),

  delete: writeProcedure
    .input(DeleteTargetGroupCommandSchema)
    .mutation(async ({ ctx, input }) => {
      const handler = Container.get(DeleteTargetGroupCommand);
      return bus.dispatch(handler, {
        id: input.id,
        organizationId: ctx.activeOrganizationId,
      });
    }),

  removeUser: writeProcedure
    .input(z.object({ id: z.string(), targetGroupId: z.string() }))
    .mutation(async ({ input }) => {
      const repo = Container.get(TargetGroupRepository);
      return repo.deleteUser(input.id, input.targetGroupId);
    }),

  addUser: writeProcedure
    .input(
      z.object({
        targetGroupId: z.string(),
        email: z.string().email(),
        firstName: z.string().trim().min(1),
        lastName: z.string().trim().min(1),
        position: z.string().trim().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const repo = Container.get(TargetGroupRepository);
      return repo.addUser(input.targetGroupId, {
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        position: input.position,
      });
    }),

  importUsers: writeProcedure
    .input(
      z.object({
        targetGroupId: z.string(),
        mode: z.enum(["insert", "upsert"]),
        file: z.string(),
        fileName: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const jobHandler = Container.get(CreateJobCommand);
      const job = await bus.dispatch(jobHandler, {
        type: "target_group_import",
        input: {
          targetGroupId: input.targetGroupId,
          mode: input.mode,
          file: input.file,
          fileName: input.fileName,
        },
        organizationId: ctx.activeOrganizationId,
        createdById: ctx.userId,
      });

      await jobQueue.add(
        "target_group_import",
        { jobId: job.id },
        {
          attempts: 1,
          removeOnComplete: { age: 3600 },
          removeOnFail: { age: 86400 },
        },
      );

      return { jobId: job.id };
    }),

  onImportProgress: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .subscription(async function* (opts) {
      const jobRepo = Container.get(JobRepository);
      let lastProgressJson: string | null = null;

      while (!opts.signal!.aborted) {
        const job = await jobRepo.findById(opts.input.jobId);
        if (!job) return;

        const progressJson = JSON.stringify(job.progress);

        if (progressJson !== lastProgressJson) {
          lastProgressJson = progressJson;
          yield tracked(job.id, {
            status: job.status,
            progress: job.progress,
          });
        }

        if (job.status === "COMPLETED" || job.status === "FAILED") {
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }),
});
