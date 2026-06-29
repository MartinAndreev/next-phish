import { Container } from "@/src/server/container";
import {
  MessageBus,
  GetJobByIdQuery,
  GetJobByIdSchema,
} from "@next-phish/backend";
import { createPermissionProcedure, router } from "../../trpc/procedures";

const bus = Container.get(MessageBus);

const readProcedure = createPermissionProcedure({
  jobs: ["read"],
});

export const jobRouter = router({
  getById: readProcedure.input(GetJobByIdSchema).query(async ({ input }) => {
    const handler = Container.get(GetJobByIdQuery);
    return bus.query(handler, { id: input.id });
  }),
});
