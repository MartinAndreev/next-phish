import { mcpCreateTargetGroupSchema } from "@next-phish/shared";
import type { McpServer, GetCaller } from "./types";

export function registerTargetGroupTools(
  server: McpServer,
  getCaller: GetCaller,
) {
  server.registerTool(
    "create_target_group",
    {
      description: "Create a new target group with optional initial users",
      inputSchema: mcpCreateTargetGroupSchema,
    },
    async (input) => {
      const { caller } = await getCaller(input.organizationId);
      const result = await caller.targetGroup.create(input);
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    },
  );
}
