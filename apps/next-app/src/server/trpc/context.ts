import { headers } from "next/headers";
import { auth } from "@/src/server/auth";
import { TRPCError } from "@trpc/server";

export interface Context {
  session: Awaited<ReturnType<typeof auth.api.getSession>>;
  headers: Headers;
  userId: string;
  apiKey?: string;
}

export async function createContext(): Promise<Context> {
  const hdrs = await headers();
  const session = await auth.api.getSession({
    headers: hdrs,
  });

  if (!session?.user?.id) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }

  return { session, headers: hdrs, userId: session.user.id };
}

export async function createContextWithHeaders(
  requestHeaders: Headers,
): Promise<Context> {
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (!session?.user?.id) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }

  const apiKey = requestHeaders.get("x-api-key") ?? undefined;

  return {
    session,
    headers: requestHeaders,
    userId: session.user.id,
    apiKey,
  };
}

export async function validateOrganizationAccess(
  ctx: Context,
  organizationId: string,
): Promise<string> {
  if (ctx.apiKey) {
    const result = await auth.api.verifyApiKey({
      body: { key: ctx.apiKey },
    });

    if (!result.valid || !result.key) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid API key",
      });
    }

    const metadata = result.key.metadata as Record<string, unknown> | null;
    const orgIds = metadata?.organizations as string[] | undefined;

    if (orgIds && orgIds.length > 0 && !orgIds.includes(organizationId)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "API key does not have access to this organization",
      });
    }
  }

  return organizationId;
}

export async function getOrganizationId(
  ctx: Context,
  inputOrganizationId?: string,
): Promise<string> {
  if (!inputOrganizationId) {
    const activeOrgId = (
      ctx.session as typeof ctx.session & {
        session?: { activeOrganizationId?: string | null };
      }
    )?.session?.activeOrganizationId;

    if (!activeOrgId) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Organization ID is required",
      });
    }

    return activeOrgId;
  }

  return validateOrganizationAccess(ctx, inputOrganizationId);
}
