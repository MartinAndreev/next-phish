import { createHash } from "node:crypto";
import { getConnInfo } from "@hono/node-server/conninfo";
import {
  Container,
  TrackingService,
  resolveClientIp,
} from "@next-phish/backend";

export function requestIp(c: Parameters<typeof getConnInfo>[0]): string {
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

export function dedupe(...values: string[]): string {
  return createHash("sha256").update(values.join("\0")).digest("hex");
}

export function enqueueTrackingEvent(
  c: Parameters<typeof getConnInfo>[0],
  input: {
    trackingRef: string;
    type: "OPENED" | "CLICKED" | "SUBMITTED" | "REPORTED";
    deduplicationKey: string;
  },
): void {
  void Container.get(TrackingService)
    .enqueueRecord({ ...input, clientIp: requestIp(c) })
    .catch(() => console.error("Failed to enqueue campaign tracking event"));
}
