import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();

app.get("/health", (c) => c.json({ status: "ok" }));

app.get("*", async (c) => {
  const requestPath = c.req.path;

  // TODO: Page lookup by path was removed. Need a new mechanism.
  return c.text(`Page not found: ${requestPath}`, 501);
});

const port = Number(process.env.STATIC_SERVER_PORT) || 3001;

console.log(`Hono server running on http://0.0.0.0:${port}`);

serve({ fetch: app.fetch, port });
