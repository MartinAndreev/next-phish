import { TRPCError } from "@trpc/server";
import { Container } from "@/src/server/container";
import {
  MessageBus,
  GetUserCountQuery,
  CreateUserCommand,
  DeleteUserCommand,
  SetUserDisabledCommand,
  ListUsersQuery,
  GetUserDeletionPreviewQuery,
  UserRepository,
  CreateUserSchema,
  ListUsersSchema,
  UserIdSchema,
  DeleteUserSchema,
  SetUserDisabledSchema,
  SetInitialPasswordSchema,
} from "@next-phish/backend";
import { db } from "@next-phish/database";
import { userNotificationQueue } from "@/src/server/queue";
import { auth } from "@/src/server/auth";
import {
  adminProcedure,
  authenticatedProcedure,
  publicProcedure,
  router,
} from "../../trpc/procedures";

const bus = Container.get(MessageBus);

export const userRouter = router({
  getCount: publicProcedure.query(() =>
    bus.query(Container.get(GetUserCountQuery), {}),
  ),

  list: adminProcedure
    .input(ListUsersSchema)
    .query(({ input }) => bus.query(Container.get(ListUsersQuery), input)),

  listOrganizations: adminProcedure.query(() =>
    db.organization.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ),

  create: adminProcedure.input(CreateUserSchema).mutation(async ({ input }) => {
    const result = await bus.dispatch(Container.get(CreateUserCommand), input);
    await userNotificationQueue.add("welcome-user", result.welcomeJob, {
      jobId: `welcome-user-${result.user.id}`,
      attempts: 5,
      backoff: { type: "exponential", delay: 5_000 },
      removeOnComplete: { age: 86_400 },
    });
    return result.user;
  }),

  deletionPreview: adminProcedure
    .input(UserIdSchema)
    .query(({ input }) =>
      bus.query(Container.get(GetUserDeletionPreviewQuery), input),
    ),

  setDisabled: adminProcedure
    .input(SetUserDisabledSchema)
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot deactivate your own account",
        });
      }
      return bus.dispatch(Container.get(SetUserDisabledCommand), input);
    }),

  delete: adminProcedure
    .input(DeleteUserSchema)
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot delete your own account",
        });
      }
      return bus.dispatch(Container.get(DeleteUserCommand), input);
    }),

  setInitialPassword: authenticatedProcedure
    .input(SetInitialPasswordSchema)
    .mutation(async ({ ctx, input }) => {
      const state = await db.user.findUnique({
        where: { id: ctx.userId },
        select: { disabledAt: true, passwordSetupRequired: true },
      });
      if (!state || state.disabledAt) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This account is disabled",
        });
      }
      if (!state.passwordSetupRequired) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The initial password is already configured",
        });
      }

      await auth.api.setPassword({
        headers: ctx.headers,
        body: { newPassword: input.password },
      });
      await Container.get(UserRepository).markPasswordConfigured(ctx.userId);
      return { success: true };
    }),
});
