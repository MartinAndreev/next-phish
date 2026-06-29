import { Container } from "@/src/server/container";
import {
  MessageBus,
  UploadFileCommand,
  DeleteFileCommand,
  ListFilesQuery,
  UploadFileSchema,
  DeleteFileSchema,
  ListFilesSchema,
} from "@next-phish/backend";
import { createPermissionProcedure, router } from "../../trpc/procedures";

const bus = Container.get(MessageBus);

const readProcedure = createPermissionProcedure({
  files: ["read"],
});

const writeProcedure = createPermissionProcedure({
  files: ["write"],
});

export const fileRouter = router({
  uploadFile: writeProcedure
    .input(UploadFileSchema)
    .mutation(async ({ ctx, input }) => {
      const handler = Container.get(UploadFileCommand);
      return bus.dispatch(handler, {
        remoteId: `${ctx.activeOrganizationId}/${crypto.randomUUID()}-${input.name}`,
        name: input.name,
        size: input.size,
        format: input.format,
        purpose: input.purpose,
        organizationId: ctx.activeOrganizationId,
        uploadedById: ctx.userId,
        body: input.data,
      });
    }),

  list: readProcedure.input(ListFilesSchema).query(async ({ ctx, input }) => {
    const handler = Container.get(ListFilesQuery);
    return bus.query(handler, {
      ...input,
      organizationId: ctx.activeOrganizationId,
    });
  }),

  delete: writeProcedure.input(DeleteFileSchema).mutation(async ({ input }) => {
    const handler = Container.get(DeleteFileCommand);
    return bus.dispatch(handler, {
      id: input.id,
    });
  }),
});
