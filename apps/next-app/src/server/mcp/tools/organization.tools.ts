import type { createMcpHandler } from "mcp-handler";
import type { createServerCallerWithOrg } from "@/src/server/trpc/server";
import {
  mcpCreateOrganizationSchema,
  mcpDeleteOrganizationSchema,
  mcpListSchema,
  mcpIdWithOrgSchema,
} from "@next-phish/shared";

type McpServer = Parameters<Parameters<typeof createMcpHandler>[0]>[0];
type GetCaller = (organizationId?: string) => Promise<{
  caller: Awaited<ReturnType<typeof createServerCallerWithOrg>>["caller"];
  organizationId?: string;
}>;

export function registerOrganizationTools(
  server: McpServer,
  getCaller: GetCaller,
) {
  server.registerTool(
    "list_organizations",
    {
      description: "List all organizations the user belongs to",
      inputSchema: mcpListSchema,
    },
    async () => {
      const { caller } = await getCaller();
      const result = await caller.organization.list({ limit: 50 });
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    },
  );

  server.registerTool(
    "get_organization",
    {
      description: "Get organization details by ID",
      inputSchema: mcpIdWithOrgSchema,
    },
    async ({ organizationId }) => {
      const { caller } = await getCaller(organizationId);
      const result = await caller.organization.getById({ organizationId });
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    },
  );

  server.registerTool(
    "create_organization",
    {
      description: "Create a new organization",
      inputSchema: mcpCreateOrganizationSchema,
    },
    async ({ name, slug }) => {
      const { caller } = await getCaller();
      const result = await caller.organization.create({ name, slug });
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    },
  );

  server.registerTool(
    "delete_organization",
    {
      description: "Delete an organization by ID",
      inputSchema: mcpDeleteOrganizationSchema,
    },
    async ({ organizationId }) => {
      const { caller } = await getCaller(organizationId);
      const result = await caller.organization.delete({ organizationId });
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    },
  );
}
