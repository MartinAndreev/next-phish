import { auth } from "@/src/server/auth";
import {
  getRequestAuthSnapshot,
  resolveAuthSnapshot,
  type RequestAuthSnapshot,
  type RequestUserState,
} from "@/src/server/request-auth";
import { TRPCError } from "@trpc/server";

export interface Context {
  session: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;
  headers: Headers;
  userId: string;
  userState: RequestUserState | null;
  apiKey?: string;
}

function createAuthenticatedContext(
  snapshot: RequestAuthSnapshot,
  apiKey?: string,
): Context {
  const { session, headers: requestHeaders, userState } = snapshot;

  if (!session?.user?.id) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }

  return {
    session,
    headers: requestHeaders,
    userId: session.user.id,
    userState,
    apiKey,
  };
}

export async function createContext(): Promise<Context> {
  return createAuthenticatedContext(await getRequestAuthSnapshot());
}

export async function createContextWithHeaders(
  requestHeaders: Headers,
): Promise<Context> {
  const snapshot = await resolveAuthSnapshot(requestHeaders);
  const apiKey = requestHeaders.get("x-api-key") ?? undefined;
  return createAuthenticatedContext(snapshot, apiKey);
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
