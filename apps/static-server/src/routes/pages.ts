import { Hono } from "hono";
import { Container, TrackingService } from "@next-phish/backend";

const pages = new Hono();
const emptyPage =
  '<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>';

pages.get("*", async (c) => {
  const ref = c.req.query("ref") ?? "";
  const path = c.req.path.replace(/^\/+|\/+$/g, "").toLowerCase();
  const page =
    path && /^[0-9A-Za-z]{12}$/.test(ref)
      ? await Container.get(TrackingService).resolveLandingPage(ref, path)
      : null;

  return c.body(page?.html ?? emptyPage, 200, {
    "Content-Type": page?.contentType ?? "text/html; charset=utf-8",
    "Cache-Control": "no-store, private",
    "X-Content-Type-Options": "nosniff",
  });
});

export { pages };
