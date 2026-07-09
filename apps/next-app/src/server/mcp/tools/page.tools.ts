import {
  mcpListSchema,
  mcpIdWithOrgSchema,
  mcpCreatePageSchema,
  mcpUpdatePageSchema,
  mcpImportPageFromUrlSchema,
} from "@next-phish/shared";
import type { McpServer, GetCaller } from "./types";

export function registerPageTools(server: McpServer, getCaller: GetCaller) {
  server.registerTool(
    "list_pages",
    {
      description: "List pages in an organization.",
      inputSchema: mcpListSchema,
    },
    async ({ organizationId, ...input }) => {
      const { caller } = await getCaller(organizationId);
      const result = await caller.page.list({ organizationId, ...input });
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    },
  );

  server.registerTool(
    "get_page",
    {
      description: "Get page by ID.",
      inputSchema: mcpIdWithOrgSchema,
    },
    async ({ id, organizationId }) => {
      const { caller } = await getCaller(organizationId);
      const result = await caller.page.getById({ id, organizationId });
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    },
  );

  server.registerTool(
    "create_page",
    {
      description: "Create a new page.",
      inputSchema: mcpCreatePageSchema,
    },
    async (input) => {
      const { caller } = await getCaller(input.organizationId);
      const result = await caller.page.create(input);
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    },
  );

  server.registerTool(
    "update_page",
    {
      description: "Update an existing page.",
      inputSchema: mcpUpdatePageSchema,
    },
    async (input) => {
      const { caller } = await getCaller(input.organizationId);
      const result = await caller.page.update({
        ...input,
        name: input.name ?? "",
      });
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    },
  );

  server.registerTool(
    "delete_page",
    {
      description: "Delete a page by ID.",
      inputSchema: mcpIdWithOrgSchema,
    },
    async ({ id, organizationId }) => {
      const { caller } = await getCaller(organizationId);
      const result = await caller.page.delete({ id, organizationId });
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    },
  );

  server.registerTool(
    "import_page_from_url",
    {
      description: "Import a page from a URL.",
      inputSchema: mcpImportPageFromUrlSchema,
    },
    async (input) => {
      const { caller } = await getCaller(input.organizationId);
      const result = await caller.page.importFromUrl(input);
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    },
  );
}
