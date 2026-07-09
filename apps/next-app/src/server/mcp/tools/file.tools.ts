import { mcpListFilesSchema } from "@next-phish/shared";
import type { McpServer, GetCaller } from "./types";

export function registerFileTools(server: McpServer, getCaller: GetCaller) {
  server.registerTool(
    "list_files",
    {
      description: "List uploaded files in an organization.",
      inputSchema: mcpListFilesSchema,
    },
    async ({ organizationId, ...input }) => {
      const { caller } = await getCaller(organizationId);
      const result = await caller.file.list({ organizationId, ...input });
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    },
  );
}
