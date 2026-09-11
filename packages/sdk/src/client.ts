import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import superjson from "superjson";
import type { ApiRouter } from "./router.generated.js";

export { TRPCClientError } from "@trpc/client";
export type { ApiRouter } from "./router.generated.js";
export type ApiInputs = inferRouterInputs<ApiRouter>;
export type ApiOutputs = inferRouterOutputs<ApiRouter>;
export type NextPhishClient = ReturnType<typeof createNextPhishClient>;

export interface NextPhishClientOptions {
  /** Instance URL, including any deployment base path (without /api/trpc). */
  baseUrl: string;
  /** Personal access token created in Next Phish. */
  token: string;
  /** Optional fetch implementation for proxies, instrumentation, or testing. */
  fetch?: typeof globalThis.fetch;
}

export function createNextPhishClient(options: NextPhishClientOptions) {
  const url = new URL(options.baseUrl);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new TypeError(
      "baseUrl must be an HTTP(S) URL without credentials, query, or fragment",
    );
  }
  if (!options.token.trim() || /[\r\n]/.test(options.token)) {
    throw new TypeError("token must be a non-empty personal access token");
  }
  url.pathname = `${url.pathname.replace(/\/+$/, "")}/api/trpc`;

  return createTRPCClient<ApiRouter>({
    links: [
      httpBatchLink({
        url: url.toString(),
        transformer: superjson,
        headers: { "x-api-key": options.token },
        fetch: options.fetch,
      }),
    ],
  });
}
