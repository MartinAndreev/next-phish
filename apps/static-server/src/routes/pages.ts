import { Hono } from "hono";

const pages = new Hono();

pages.get("*", async (c) => {
  const requestPath = c.req.path;

  // TODO: Page lookup by path was removed. Need a new mechanism.
  return c.text(`Page not found: ${requestPath}`, 501);
});

export { pages };
