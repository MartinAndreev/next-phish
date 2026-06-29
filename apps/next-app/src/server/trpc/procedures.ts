import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";
import { Container } from "@/src/server/container";
import { OrganizationRepository } from "@next-phish/backend";
import type { Context } from "./context";
import { getOrganizationId } from "./context";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});

export const organizationMemberProcedure = protectedProcedure
  .input(z.object({ organizationId: z.string() }))
  .use(async ({ ctx, input, next }) => {
    const orgRepo = Container.get(OrganizationRepository);
    const org = await orgRepo.findById(input.organizationId);

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
        message: "You are not a member of this organization",
      });
    }

    return next({
      ctx: { ...ctx },
    });
  });

export const activeOrganizationProcedure = protectedProcedure
  .input(z.object({ organizationId: z.string().optional() }).optional())
  .use(async ({ ctx, input, next }) => {
    const orgRepo = Container.get(OrganizationRepository);
    const organizationId = await getOrganizationId(ctx, input?.organizationId);

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

    return next({
      ctx: { ...ctx, activeOrganizationId: organizationId },
    });
  });
