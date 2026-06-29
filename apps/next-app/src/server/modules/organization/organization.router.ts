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
  createPermissionProcedure,
  organizationMemberProcedure,
  router,
} from "../../trpc/procedures";

const bus = Container.get(MessageBus);

const writeProcedure = createPermissionProcedure({
  organizations: ["write"],
});

const readProcedureNoOrg = createPermissionProcedure(
  { organizations: ["read"] },
  { requireOrganization: false },
);

export const organizationRouter = router({
  list: readProcedureNoOrg
    .input(GetUserOrganizationsSchema)
    .query(async ({ ctx, input }) => {
      const handler = Container.get(GetUserOrganizationsQuery);
      return bus.query(handler, {
        ...input,
        userId: ctx.userId,
      });
    }),

  getById: organizationMemberProcedure.query(async ({ ctx, input }) => {
    const handler = Container.get(GetOrganizationByIdQuery);
    return bus.query(handler, {
      id: input.organizationId,
      userId: ctx.userId,
    });
  }),

  listMembers: organizationMemberProcedure
    .input(GetOrganizationMembersSchema)
    .query(async ({ ctx, input }) => {
      const handler = Container.get(GetOrganizationMembersQuery);
      return bus.query(handler, {
        ...input,
        userId: ctx.userId,
      });
    }),

  create: writeProcedure
    .input(CreateOrganizationCommandSchema)
    .mutation(async ({ ctx, input }) => {
      const handler = Container.get(CreateOrganizationCommand);
      return bus.dispatch(handler, {
        ...input,
        userId: ctx.userId,
        headers: ctx.headers,
      });
    }),

  delete: writeProcedure
    .input(z.object({ organizationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const handler = Container.get(DeleteOrganizationCommand);
      return bus.dispatch(handler, {
        organizationId: input.organizationId,
        headers: ctx.headers,
      });
    }),
});
