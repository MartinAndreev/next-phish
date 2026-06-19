import { Container } from "@/src/server/container";
import {
  MessageBus,
  GetUserOrganizationsQuery,
  CreateOrganizationCommand,
  GetUserOrganizationsSchema,
  CreateOrganizationCommandSchema,
} from "@next-phish/backend";
import { protectedProcedure, router } from "../../trpc/procedures";

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
});
