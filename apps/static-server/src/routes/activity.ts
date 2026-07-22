import { Hono } from "hono";
import { Container, TrackingService } from "@next-phish/backend";
import { dedupe, enqueueTrackingEvent } from "./tracking-request";

const activity = new Hono();
const pixel = Buffer.from("R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=", "base64");

activity.get("/c", async (c) => {
  const ref = c.req.query("ref") ?? "";
  const page = /^[0-9A-Za-z]{12}$/.test(ref)
    ? await Container.get(TrackingService).resolveLandingPage(ref)
    : null;
  if (page)
    enqueueTrackingEvent(c, {
      trackingRef: ref,
      type: "CLICKED",
      deduplicationKey: dedupe(ref, "CLICKED", "landing"),
    });
  const html =
    page?.html ??
    '<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>';
  return c.body(html, 200, {
    "Content-Type": page?.contentType ?? "text/html; charset=utf-8",
    "Cache-Control": "no-store, private",
    "X-Content-Type-Options": "nosniff",
  });
});

activity.get("/p.gif", async (c) => {
  const ref = c.req.query("ref") ?? "";
  if (/^[0-9A-Za-z]{12}$/.test(ref))
    enqueueTrackingEvent(c, {
      trackingRef: ref,
      type: "OPENED",
      deduplicationKey: dedupe(ref, "OPENED"),
    });
  return c.body(pixel, 200, {
    "Content-Type": "image/gif",
    "Cache-Control": "no-store, private",
    "Content-Length": String(pixel.length),
  });
});

activity.get("/r/:linkId", async (c) => {
  const ref = c.req.query("ref") ?? "";
  const linkId = c.req.param("linkId");
  let destination: string | null = null;
  if (/^[0-9A-Za-z]{12}$/.test(ref) && /^[0-9A-Za-z]{1,12}$/.test(linkId)) {
    const service = Container.get(TrackingService);
    destination = await service.resolveLink(ref, linkId);
    if (destination)
      enqueueTrackingEvent(c, {
        trackingRef: ref,
        type: "CLICKED",
        deduplicationKey: dedupe(ref, "CLICKED", linkId),
      });
  }
  return c.redirect(destination ?? "/", 302);
});

activity.post("/s", async (c) => {
  const ref = c.req.query("ref") ?? "";
  const validRef = /^[0-9A-Za-z]{12}$/.test(ref);
  const redirectUrl = validRef
    ? await Container.get(TrackingService).resolveSubmissionRedirect(ref)
    : null;
  if (validRef)
    enqueueTrackingEvent(c, {
      trackingRef: ref,
      type: "SUBMITTED",
      deduplicationKey: dedupe(ref, "SUBMITTED"),
    });
  return c.body(null, 204, {
    "Cache-Control": "no-store",
    ...(redirectUrl ? { "X-Redirect-To": redirectUrl } : {}),
  });
});

activity.post("/a", async (c) => {
  const ref = c.req.query("ref") ?? "";
  if (/^[0-9A-Za-z]{12}$/.test(ref))
    enqueueTrackingEvent(c, {
      trackingRef: ref,
      type: "REPORTED",
      deduplicationKey: dedupe(ref, "REPORTED"),
    });
  return c.body(null, 204, { "Cache-Control": "no-store" });
});

export { activity };
