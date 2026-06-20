import { Container } from "@/src/server/container";
import { z } from "zod";
import {
  MessageBus,
  GetUserOrganizationsQuery,
  GetOrganizationByIdQuery,
  GetOrganizationMembersQuery,
  CreateOrganizationCommand,
  DeleteOrganizationCommand,
  GetUserOrganizationsSchema,
  CreateOrganizationCommandSchema,
  GetOrganizationMembersSchema,
} from "@next-phish/backend";
import {
  protectedProcedure,
  organizationMemberProcedure,
  router,
} from "../../trpc/procedures";

const bus = Container.get(MessageBus);

export const organizationRouter = router({
  list: protectedProcedure
    .input(GetUserOrganizationsSchema)
    .query(async ({ ctx, input }) => {
      const handler = Container.get(GetUserOrganizationsQuery);
      return bus.query(handler, {
        ...input,
        userId: ctx.session.user.id,
      });
    }),

  getById: organizationMemberProcedure.query(async ({ ctx, input }) => {
    const handler = Container.get(GetOrganizationByIdQuery);
    return bus.query(handler, {
      id: input.organizationId,
      userId: ctx.session.user.id,
    });
  }),

  listMembers: organizationMemberProcedure
    .input(GetOrganizationMembersSchema)
    .query(async ({ ctx, input }) => {
      const handler = Container.get(GetOrganizationMembersQuery);
      return bus.query(handler, {
        ...input,
        userId: ctx.session.user.id,
      });
    }),

  create: protectedProcedure
    .input(CreateOrganizationCommandSchema)
    .mutation(async ({ ctx, input }) => {
      const handler = Container.get(CreateOrganizationCommand);
      return bus.dispatch(handler, {
        ...input,
        userId: ctx.session.user.id,
        headers: ctx.headers,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const handler = Container.get(DeleteOrganizationCommand);
      return bus.dispatch(handler, {
        organizationId: input.organizationId,
        headers: ctx.headers,
      });
    }),
});
