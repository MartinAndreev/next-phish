import { auth } from "@/src/server/auth";
import { db } from "@next-phish/database";
import { toNextJsHandler } from "better-auth/next-js";

const handlers = toNextJsHandler(auth);
const pendingAccountSafePaths = new Set([
  "/api/auth/get-session",
  "/api/auth/sign-out",
  "/api/auth/magic-link/verify",
  "/api/auth/sign-in/email",
  "/api/auth/sign-in/magic-link",
]);

async function guardAccountSetup(request: Request): Promise<Response | null> {
  const path = new URL(request.url).pathname;
  if (pendingAccountSafePaths.has(path)) return null;

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user.id) return null;
  const state = await db.user.findUnique({
    where: { id: session.user.id },
    select: { disabledAt: true, passwordSetupRequired: true },
  });
  if (state?.disabledAt) {
    return Response.json(
      { message: "This account is disabled" },
      { status: 403 },
    );
  }
  if (state?.passwordSetupRequired) {
    return Response.json(
      { message: "Set your initial password before continuing" },
      { status: 412 },
    );
  }
  return null;
}

export async function GET(request: Request) {
  return (await guardAccountSetup(request)) ?? handlers.GET(request);
}

export async function POST(request: Request) {
  return (await guardAccountSetup(request)) ?? handlers.POST(request);
}
