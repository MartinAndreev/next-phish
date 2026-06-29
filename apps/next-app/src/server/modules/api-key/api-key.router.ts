import { z } from "zod";
import { auth } from "@/src/server/auth";
import { Container } from "@/src/server/container";
import { OrganizationRepository } from "@next-phish/backend";
import { protectedProcedure, router } from "../../trpc/procedures";

export const apiKeyRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().max(32).optional(),
        organizationIds: z.array(z.string()).optional(),
        expiresInDays: z.number().int().min(1).max(365).optional(),
        permissions: z.any().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.organizationIds && input.organizationIds.length > 0) {
        const orgRepo = Container.get(OrganizationRepository);
        for (const orgId of input.organizationIds) {
          const org = await orgRepo.findById(orgId);
          if (!org) {
            throw new Error(`Organization ${orgId} not found`);
          }
          const member = org.members.find((m) => m.userId === ctx.userId);
          if (!member) {
            throw new Error(`You are not a member of organization ${orgId}`);
          }
        }
      }

      const metadata: Record<string, unknown> = {};
      if (input.organizationIds && input.organizationIds.length > 0) {
        metadata.organizations = input.organizationIds;
      }

      const permissions =
        input.permissions && Object.keys(input.permissions).length > 0
          ? (input.permissions as Record<string, string[]>)
          : {};

      const result = await auth.api.createApiKey({
        body: {
          name: input.name,
          expiresIn: input.expiresInDays
            ? input.expiresInDays * 24 * 60 * 60
            : undefined,
          permissions,
          userId: ctx.userId,
          metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        },
      });

      return result;
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
