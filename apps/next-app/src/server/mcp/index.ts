import { createMcpHandler } from "mcp-handler";
import { createServerCallerWithOrg } from "@/src/server/trpc/server";
import { auth } from "@/src/server/auth";
import {
  registerOrganizationTools,
  registerEmailTemplateTools,
  registerPageTools,
  registerFileTools,
  registerJobTools,
  registerSendingProfileTools,
  registerTargetGroupTools,
  registerTaskTools,
} from "./tools";

const redisHost = process.env.REDIS_HOST || "localhost";
const redisPort = process.env.REDIS_PORT || "6379";
const redisUrl = `redis://${redisHost}:${redisPort}`;

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
      (server) => {
        const getCaller = async (organizationId?: string) => {
          const result = await createServerCallerWithOrg(
            organizationId,
            apiHeaders,
          );
          return {
            caller: result.caller,
            organizationId: result.organizationId,
          };
        };

        registerOrganizationTools(server, getCaller);
        registerEmailTemplateTools(server, getCaller);
        registerPageTools(server, getCaller);
        registerFileTools(server, getCaller);
        registerJobTools(server, getCaller);
        registerSendingProfileTools(server, getCaller);
        registerTargetGroupTools(server, getCaller);
        registerTaskTools(server, getCaller);
      },
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
