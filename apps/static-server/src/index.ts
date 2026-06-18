import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { db } from "@next-phish/database";

const app = new Hono();

app.get("/health", (c) => c.json({ status: "ok" }));

app.get("*", async (c) => {
  const path = c.req.path;

  const page = await db.page.findUnique({
    where: { path, enabled: true },
    select: { html: true, content_type: true },
  });

  if (!page) {
    return c.notFound();
  }

  return c.html(page.html, 200, {
    "Content-Type": page.content_type ?? "text/html",
  });
});

const port = Number(process.env.STATIC_SERVER_PORT) || 3001;

console.log(`Hono server running on http://0.0.0.0:${port}`);

serve({ fetch: app.fetch, port });
