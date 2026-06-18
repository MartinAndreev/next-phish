"use client";

import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";
import { twoFactorClient } from "better-auth/client/plugins";
import { organizationClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [
    magicLinkClient(),
    twoFactorClient({
      onTwoFactorRedirect({ twoFactorMethods }) {
        const params = twoFactorMethods?.length
          ? `?methods=${twoFactorMethods.join(",")}`
          : "";
        window.location.href = `/auth/two-factor${params}`;
      },
    }),
    organizationClient(),
  ],
});
