import { headers } from "next/headers";
import { auth } from "@/src/server/auth";

export async function createContext() {
  const hdrs = await headers();
  const session = await auth.api.getSession({
    headers: hdrs,
  });

  return { session, headers: hdrs };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
