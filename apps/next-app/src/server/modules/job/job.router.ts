import { Container } from "@/src/server/container";
import {
  MessageBus,
  GetJobByIdQuery,
  GetJobByIdSchema,
} from "@next-phish/backend";
import { protectedProcedure, router } from "../../trpc/procedures";

const bus = Container.get(MessageBus);

export const jobRouter = router({
  getById: protectedProcedure
    .input(GetJobByIdSchema)
    .query(async ({ input }) => {
      const handler = Container.get(GetJobByIdQuery);
      return bus.query(handler, { id: input.id });
    }),
});
