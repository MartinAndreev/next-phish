import { Hono } from "hono";
import {
  Container,
  ProviderWebhookService,
  verifyWebhookSignature,
} from "@next-phish/backend";
import { deliveryEventTypeSchema } from "@next-phish/shared";

const providerEvents = new Hono();

providerEvents.post("/w", async (c) => {
  const secret = process.env.DELIVERY_WEBHOOK_SECRET;
  if (!secret) return c.body(null, 503);
  const timestamp = c.req.header("x-event-timestamp") ?? "";
  const signature = c.req.header("x-event-signature") ?? "";
  const rawBody = await c.req.text();
  if (
    !verifyWebhookSignature({
      secret,
      timestamp,
      signature,
      rawBody,
    })
  )
    return c.body(null, 401);

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return c.body(null, 400);
  }
  if (!payload || typeof payload !== "object") return c.body(null, 400);
  const value = payload as Record<string, unknown>;
  const type = deliveryEventTypeSchema.safeParse(value.type);
  if (
    !type.success ||
    typeof value.providerMessageId !== "string" ||
    typeof value.providerEventId !== "string" ||
    typeof value.occurredAt !== "string"
  )
    return c.body(null, 400);
  const occurredAt = new Date(value.occurredAt);
  if (Number.isNaN(occurredAt.getTime())) return c.body(null, 400);
  const allowedMetadata = new Set([
    "statusCode",
    "responseCode",
    "reason",
    "enhancedStatus",
  ]);
  const metadata =
    value.metadata && typeof value.metadata === "object"
      ? Object.fromEntries(
          Object.entries(value.metadata).filter(
            ([key, item]) =>
              allowedMetadata.has(key) &&
              (item === null ||
                typeof item === "string" ||
                typeof item === "number" ||
                typeof item === "boolean"),
          ),
        )
      : undefined;
  await Container.get(ProviderWebhookService).accept({
    providerMessageId: value.providerMessageId,
    providerEventId: value.providerEventId,
    type: type.data,
    occurredAt,
    metadata,
  });
  return c.body(null, 202, { "Cache-Control": "no-store" });
});

export { providerEvents };
