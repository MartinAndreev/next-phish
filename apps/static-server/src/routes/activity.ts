import { createHash } from "node:crypto";
import { getConnInfo } from "@hono/node-server/conninfo";
import { Hono } from "hono";
import {
  Container,
  TrackingService,
  resolveClientIp,
} from "@next-phish/backend";

const activity = new Hono();
const pixel = Buffer.from("R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=", "base64");

function requestIp(c: Parameters<typeof getConnInfo>[0]): string {
  const directAddress = getConnInfo(c).remote.address ?? "127.0.0.1";
  const trustedProxyNetworks = (process.env.TRUSTED_PROXY_NETWORKS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  try {
    return resolveClientIp({
      directAddress,
      forwardedFor: c.req.header("x-forwarded-for"),
      trustedProxyNetworks,
    });
  } catch {
    return "127.0.0.1";
  }
}

function dedupe(...values: string[]): string {
  return createHash("sha256").update(values.join("\0")).digest("hex");
}

activity.get("/p.gif", async (c) => {
  const ref = c.req.query("ref") ?? "";
  if (/^[0-9A-Za-z]{12}$/.test(ref)) {
    await Container.get(TrackingService).record({
      trackingRef: ref,
      type: "OPENED",
      clientIp: requestIp(c),
      deduplicationKey: dedupe(ref, "OPENED"),
    });
  }
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
      await service.record({
        trackingRef: ref,
        type: "CLICKED",
        clientIp: requestIp(c),
        deduplicationKey: dedupe(ref, "CLICKED", linkId),
      });
  }
  return c.redirect(destination ?? "/", 302);
});

activity.post("/s", async (c) => {
  const ref = c.req.query("ref") ?? "";
  if (/^[0-9A-Za-z]{12}$/.test(ref))
    await Container.get(TrackingService).record({
      trackingRef: ref,
      type: "SUBMITTED",
      clientIp: requestIp(c),
      deduplicationKey: dedupe(ref, "SUBMITTED"),
    });
  // The request body is deliberately not parsed or persisted.
  return c.body(null, 204, { "Cache-Control": "no-store" });
});

activity.post("/a", async (c) => {
  const ref = c.req.query("ref") ?? "";
  if (/^[0-9A-Za-z]{12}$/.test(ref))
    await Container.get(TrackingService).record({
      trackingRef: ref,
      type: "REPORTED",
      clientIp: requestIp(c),
      deduplicationKey: dedupe(ref, "REPORTED"),
    });
  return c.body(null, 204, { "Cache-Control": "no-store" });
});

export { activity };
