import { appRouter } from "./router";
import { createContext } from "./context";

export async function createServerCaller() {
  const context = await createContext();
  const caller = appRouter.createCaller(context);
  return caller;
}
