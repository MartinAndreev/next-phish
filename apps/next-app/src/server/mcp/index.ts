import { createMcpHandler } from "mcp-handler";
import { createServerCallerWithOrg } from "@/src/server/trpc/server";
import { auth } from "@/src/server/auth";
import {
  mcpCreateOrganizationSchema,
  mcpDeleteOrganizationSchema,
  mcpListSchema,
  mcpIdWithOrgSchema,
  mcpCreateEmailTemplateSchema,
  mcpUpdateEmailTemplateSchema,
  mcpCreatePageSchema,
  mcpUpdatePageSchema,
  mcpImportPageFromUrlSchema,
  mcpListFilesSchema,
  mcpGetJobStatusSchema,
} from "@next-phish/shared";

const redisHost = process.env.REDIS_HOST || "localhost";
const redisPort = process.env.REDIS_PORT || "6379";
const redisUrl = `redis://${redisHost}:${redisPort}`;

interface CallerResult {
  caller: Awaited<ReturnType<typeof createServerCallerWithOrg>>["caller"];
  organizationId?: string;
}

function registerTools(
  server: Parameters<Parameters<typeof createMcpHandler>[0]>[0],
  getCaller: (organizationId?: string) => Promise<CallerResult>,
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

export async function handleMcpRequest(req: Request) {
  const apiKey = req.headers.get("x-api-key");

  if (!apiKey) {
    return new Response("Missing API key", { status: 401 });
  }

  try {
    const apiHeaders = new Headers({ "x-api-key": apiKey });
    const session = await auth.api.getSession({
      headers: apiHeaders,
    });

    if (!session) {
      return new Response("Invalid API key", { status: 401 });
    }

    return createMcpHandler(
      (server) =>
        registerTools(server, async (organizationId) => {
          const result = await createServerCallerWithOrg(
            organizationId,
            apiHeaders,
          );
          return {
            caller: result.caller,
            organizationId: result.organizationId,
          };
        }),
      { serverInfo: { name: "next-phish", version: "1.0.0" } },
      {
        redisUrl,
        maxDuration: 60,
        basePath: "/api",
      },
    )(req);
  } catch {
    return new Response("Invalid API key", { status: 401 });
  }
}
