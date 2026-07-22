import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";
import { Container } from "@/src/server/container";
import { OrganizationRepository } from "@next-phish/backend";
import { auth } from "@/src/server/auth";
import type { Context } from "./context";
import { getOrganizationId } from "./context";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  sse: {
    ping: {
      enabled: true,
      intervalMs: 2_000,
    },
    client: {
      reconnectAfterInactivityMs: 5_000,
    },
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const authenticatedProcedure = t.procedure;

export const protectedProcedure = authenticatedProcedure.use(
  async ({ ctx, next }) => {
    const user = ctx.userState;

    if (!user || user.disabledAt) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "This account is disabled",
      });
    }
    if (user.passwordSetupRequired) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Set your initial password before continuing",
      });
    }

    return next({ ctx });
  },
);

export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.userState?.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Administrator access is required",
    });
  }
  return next({ ctx });
});

type Permissions = Record<string, string[]>;

export function createPermissionProcedure(
  requiredPermissions: Permissions,
  options?: { requireOrganization?: boolean },
) {
  const requireOrganization = options?.requireOrganization ?? true;

  return protectedProcedure
    .input(z.object({ organizationId: z.string().optional() }).optional())
    .use(async ({ ctx, input, next }) => {
      if (ctx.apiKey) {
        const result = await auth.api.verifyApiKey({
          body: {
            key: ctx.apiKey,
            permissions: requiredPermissions,
          },
        });

        if (!result.valid) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "API key does not have the required permissions",
          });
        }
      } else {
        const organizationId = input?.organizationId
          ? await getOrganizationId(ctx, input.organizationId)
          : undefined;

        if (organizationId) {
          const result = await auth.api.hasPermission({
            headers: ctx.headers,
            body: {
              permissions: requiredPermissions,
              organizationId,
            },
          });

          if (!result) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "You do not have the required permissions",
            });
          }
        }
      }

      let organizationId: string | undefined;

      if (requireOrganization) {
        organizationId = input?.organizationId
          ? await getOrganizationId(ctx, input.organizationId)
          : await getOrganizationId(ctx);

        const orgRepo = Container.get(OrganizationRepository);
        const org = await orgRepo.findById(organizationId);

        if (!org) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Organization not found",
          });
        }

        const member = org.members.find((m) => m.userId === ctx.userId);

        if (!member) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You are not a member of the active organization",
          });
        }
      }

      return next({
        ctx: { ...ctx, activeOrganizationId: organizationId ?? "" },
      });
    });
}
