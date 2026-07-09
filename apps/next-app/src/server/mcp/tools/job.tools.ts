import { mcpGetJobStatusSchema } from "@next-phish/shared";
import type { McpServer, GetCaller } from "./types";

export function registerJobTools(server: McpServer, getCaller: GetCaller) {
  server.registerTool(
    "get_job_status",
    {
      description: "Get background job status.",
      inputSchema: mcpGetJobStatusSchema,
    },
    async ({ jobId }) => {
      const { caller } = await getCaller();
      const result = await caller.job.getById({ id: jobId });
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    },
  );
}
