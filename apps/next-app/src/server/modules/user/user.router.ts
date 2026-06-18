import { Container } from "@/src/server/container";
import {
  MessageBus,
  GetUserCountQuery,
  CreateUserCommand,
} from "@next-phish/backend";
import { CreateUserSchema } from "@next-phish/backend";
import { publicProcedure, router } from "../../trpc/procedures";

const bus = Container.get(MessageBus);

export const userRouter = router({
  getCount: publicProcedure.query(async () => {
    const handler = Container.get(GetUserCountQuery);
    return bus.query(handler, {});
  }),

  create: publicProcedure
    .input(CreateUserSchema)
    .mutation(async ({ input }) => {
      const handler = Container.get(CreateUserCommand);
      return bus.dispatch(handler, input);
    }),
});
