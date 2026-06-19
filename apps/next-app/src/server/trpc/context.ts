import { headers } from "next/headers";
import { auth } from "@/src/server/auth";

export async function createContext() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return { session };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
