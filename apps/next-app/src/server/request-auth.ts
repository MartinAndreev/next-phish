import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { db } from "@next-phish/database";
import { auth } from "./auth";

export interface RequestUserState {
  disabledAt: Date | null;
  passwordSetupRequired: boolean;
  role: string;
}

export interface RequestSessionSnapshot {
  headers: Headers;
  session: Awaited<ReturnType<typeof auth.api.getSession>>;
}

export interface RequestAuthSnapshot extends RequestSessionSnapshot {
  userState: RequestUserState | null;
}

async function resolveSession(
  requestHeaders: Headers,
): Promise<RequestSessionSnapshot> {
  const session = await auth.api.getSession({ headers: requestHeaders });
  return { headers: requestHeaders, session };
}

async function resolveUserState(
  session: RequestSessionSnapshot["session"],
): Promise<RequestUserState | null> {
  if (!session?.user?.id) return null;

  return db.user.findUnique({
    where: { id: session.user.id },
    select: {
      disabledAt: true,
      passwordSetupRequired: true,
      role: true,
    },
  });
}

export const getRequestSessionSnapshot = cache(
  async (): Promise<RequestSessionSnapshot> => resolveSession(await headers()),
);

export const getRequestAuthSnapshot = cache(
  async (): Promise<RequestAuthSnapshot> => {
    const snapshot = await getRequestSessionSnapshot();
    const userState = await resolveUserState(snapshot.session);
    return { ...snapshot, userState };
  },
);

export async function resolveAuthSnapshot(
  requestHeaders: Headers,
): Promise<RequestAuthSnapshot> {
  const snapshot = await resolveSession(requestHeaders);
  const userState = await resolveUserState(snapshot.session);
  return { ...snapshot, userState };
}
