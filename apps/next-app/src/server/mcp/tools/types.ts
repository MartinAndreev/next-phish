import type { createMcpHandler } from "mcp-handler";
import type { createServerCallerWithOrg } from "@/src/server/trpc/server";

export type McpServer = Parameters<Parameters<typeof createMcpHandler>[0]>[0];
export type GetCaller = (organizationId?: string) => Promise<{
  caller: Awaited<ReturnType<typeof createServerCallerWithOrg>>["caller"];
  organizationId?: string;
}>;
