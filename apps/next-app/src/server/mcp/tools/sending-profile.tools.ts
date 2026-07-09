import {
  mcpListSchema,
  mcpIdWithOrgSchema,
  mcpCreateSendingProfileSchema,
  mcpUpdateSendingProfileSchema,
} from "@next-phish/shared";
import type { McpServer, GetCaller } from "./types";

export function registerSendingProfileTools(
  server: McpServer,
  getCaller: GetCaller,
) {
  server.registerTool(
    "list_sending_profiles",
    {
      description:
        "List sending profiles (SMTP/API mail configurations) in an organization.",
      inputSchema: mcpListSchema,
    },
    async ({ organizationId, ...input }) => {
      const { caller } = await getCaller(organizationId);
      const result = await caller.mailSending.list({
        organizationId,
        ...input,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    },
  );

  server.registerTool(
    "get_sending_profile",
    {
      description: "Get a sending profile by ID.",
      inputSchema: mcpIdWithOrgSchema,
    },
    async ({ id, organizationId }) => {
      const { caller } = await getCaller(organizationId);
      const result = await caller.mailSending.getById({ id, organizationId });
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    },
  );

  server.registerTool(
    "create_sending_profile",
    {
      description:
        "Create a new sending profile (SMTP, SendGrid, Mailgun, AWS SES, etc.)",
      inputSchema: mcpCreateSendingProfileSchema,
    },
    async (input) => {
      const { caller } = await getCaller(input.organizationId);
      const result = await caller.mailSending.create(input);
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    },
  );

  server.registerTool(
    "update_sending_profile",
    {
      description: "Update an existing sending profile.",
      inputSchema: mcpUpdateSendingProfileSchema,
    },
    async (input) => {
      const { caller } = await getCaller(input.organizationId);
      const result = await caller.mailSending.update(input);
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    },
  );

  server.registerTool(
    "delete_sending_profile",
    {
      description: "Delete a sending profile by ID.",
      inputSchema: mcpIdWithOrgSchema,
    },
    async ({ id, organizationId }) => {
      const { caller } = await getCaller(organizationId);
      const result = await caller.mailSending.delete({ id, organizationId });
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    },
  );
}
