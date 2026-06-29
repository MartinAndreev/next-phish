import { z } from "zod";
import { auth } from "@/src/server/auth";
import {
  Container,
  MessageBus,
  CreateApiKeyCommand,
} from "@next-phish/backend";
import { protectedProcedure, router } from "../../trpc/procedures";

const bus = Container.get(MessageBus);

export const apiKeyRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().max(32).optional(),
        organizationIds: z.array(z.string()).optional(),
        expiresInDays: z.number().int().min(1).max(365).optional(),
        permissions: z.any().optional(),
        rateLimitEnabled: z.boolean().optional(),
        rateLimitMax: z.number().int().min(1).optional(),
        rateLimitTimeWindow: z.number().int().min(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const command = Container.get(CreateApiKeyCommand);
      return bus.dispatch(command, {
        userId: ctx.userId,
        name: input.name,
        organizationIds: input.organizationIds,
        expiresIn: input.expiresInDays
          ? input.expiresInDays * 24 * 60 * 60
          : undefined,
        permissions:
          input.permissions && Object.keys(input.permissions).length > 0
            ? (input.permissions as Record<string, string[]>)
            : undefined,
        rateLimitEnabled: input.rateLimitEnabled,
        rateLimitMax: input.rateLimitMax,
        rateLimitTimeWindow: input.rateLimitTimeWindow,
      });
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const result = await auth.api.listApiKeys({
      headers: ctx.headers,
    });

    return result;
  }),

  delete: protectedProcedure
    .input(
      z.object({
        keyId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await auth.api.deleteApiKey({
        body: {
          keyId: input.keyId,
        },
        headers: ctx.headers,
      });

      return result;
    }),
});
