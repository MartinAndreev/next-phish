import {
  mcpListSchema,
  mcpIdWithOrgSchema,
  mcpCreateEmailTemplateSchema,
  mcpUpdateEmailTemplateSchema,
} from "@next-phish/shared";
import type { McpServer, GetCaller } from "./types";

export function registerEmailTemplateTools(
  server: McpServer,
  getCaller: GetCaller,
) {
  server.registerTool(
    "list_email_templates",
    {
      description: "List email templates in an organization.",
      inputSchema: mcpListSchema,
    },
    async ({ organizationId, ...input }) => {
      const { caller } = await getCaller(organizationId);
      const result = await caller.emailTemplate.list({
        organizationId,
        ...input,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    },
  );

  server.registerTool(
    "get_email_template",
    {
      description: "Get email template by ID.",
      inputSchema: mcpIdWithOrgSchema,
    },
    async ({ id, organizationId }) => {
      const { caller } = await getCaller(organizationId);
      const result = await caller.emailTemplate.getById({ id, organizationId });
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    },
  );

  server.registerTool(
    "create_email_template",
    {
      description:
        "Create a new email template. Provide HTML content — the visual editor design is generated automatically.",
      inputSchema: mcpCreateEmailTemplateSchema,
    },
    async (input) => {
      const { caller } = await getCaller(input.organizationId);
      const result = await caller.emailTemplate.create(input);
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    },
  );

  server.registerTool(
    "update_email_template",
    {
      description:
        "Update an existing email template. Provide HTML content — the visual editor design is generated automatically.",
      inputSchema: mcpUpdateEmailTemplateSchema,
    },
    async (input) => {
      const { caller } = await getCaller(input.organizationId);
      const result = await caller.emailTemplate.update({
        ...input,
        name: input.name ?? "",
        html: input.html ?? "",
        design: {},
      });
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    },
  );

  server.registerTool(
    "delete_email_template",
    {
      description: "Delete an email template by ID.",
      inputSchema: mcpIdWithOrgSchema,
    },
    async ({ id, organizationId }) => {
      const { caller } = await getCaller(organizationId);
      const result = await caller.emailTemplate.delete({ id, organizationId });
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    },
  );
}
