import { appRouter } from "./router";
import { createContext, createContextWithHeaders } from "./context";

export async function createServerCaller() {
  const context = await createContext();
  const caller = appRouter.createCaller(context);
  return caller;
}

export async function createServerCallerWithOrg(
  organizationId?: string,
  requestHeaders?: Headers,
) {
  const context = requestHeaders
    ? await createContextWithHeaders(requestHeaders)
    : await createContext();

  const caller = appRouter.createCaller(context);
  return { caller, organizationId };
}
