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
  DeliveryRepository,
  normalizeNetwork,
} from "@next-phish/backend";
import {
  createPermissionProcedure,
  organizationMemberProcedure,
  router,
} from "../../trpc/procedures";
import { toRouterPermissions } from "@next-phish/shared";

const bus = Container.get(MessageBus);

const writeProcedure = createPermissionProcedure(
  toRouterPermissions("organizations", "write"),
);

const readProcedureNoOrg = createPermissionProcedure(
  toRouterPermissions("organizations", "read"),
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

  setDeliveryEnabled: writeProcedure
    .input(z.object({ deliveryEnabled: z.boolean() }))
    .mutation(({ ctx, input }) =>
      Container.get(DeliveryRepository).setOrganizationDeliveryEnabled(
        ctx.activeOrganizationId,
        input.deliveryEnabled,
      ),
    ),

  listIgnoredNetworks: writeProcedure.query(({ ctx }) =>
    Container.get(DeliveryRepository).listIgnoredNetworks(
      ctx.activeOrganizationId,
    ),
  ),

  createIgnoredNetwork: writeProcedure
    .input(
      z.object({
        network: z.string().trim().min(1).max(64),
        description: z.string().trim().max(200).optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      const normalized = normalizeNetwork(input.network).canonical;
      return Container.get(DeliveryRepository).createIgnoredNetwork({
        organizationId: ctx.activeOrganizationId,
        createdById: ctx.userId,
        network: input.network,
        normalizedNetwork: normalized,
        description: input.description,
      });
    }),

  listIgnoredNetworkAudits: writeProcedure.query(({ ctx }) =>
    Container.get(DeliveryRepository).listIgnoredNetworkAudits(
      ctx.activeOrganizationId,
    ),
  ),

  deleteIgnoredNetwork: writeProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(({ ctx, input }) =>
      Container.get(DeliveryRepository).deleteIgnoredNetwork(
        input.id,
        ctx.activeOrganizationId,
        ctx.userId,
      ),
    ),

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
