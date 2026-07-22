import "server-only";

import { cache } from "react";
import { createServerCaller } from "./trpc/server";

export const getRequestOrganizations = cache(
  async (limit = 100, offset = 0) => {
    const caller = await createServerCaller();
    return caller.organization.list({ limit, offset });
  },
);
