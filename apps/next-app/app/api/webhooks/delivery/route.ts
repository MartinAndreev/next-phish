import {
  ProviderWebhookService,
  verifyWebhookSignature,
} from "@next-phish/backend";
import { deliveryEventTypeSchema } from "@next-phish/shared";
import { Container } from "@/src/server/container";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.DELIVERY_WEBHOOK_SECRET;
  if (!secret) return new Response(null, { status: 503 });

  const timestamp = request.headers.get("x-event-timestamp") ?? "";
  const signature = request.headers.get("x-event-signature") ?? "";
  const rawBody = await request.text();
  if (
    !verifyWebhookSignature({
      secret,
      timestamp,
      signature,
      rawBody,
    })
  )
    return new Response(null, { status: 401 });

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response(null, { status: 400 });
  }
  if (!payload || typeof payload !== "object")
    return new Response(null, { status: 400 });

  const value = payload as Record<string, unknown>;
  const type = deliveryEventTypeSchema.safeParse(value.type);
  if (
    !type.success ||
    typeof value.providerMessageId !== "string" ||
    typeof value.providerEventId !== "string" ||
    typeof value.occurredAt !== "string"
  )
    return new Response(null, { status: 400 });

  const occurredAt = new Date(value.occurredAt);
  if (Number.isNaN(occurredAt.getTime()))
    return new Response(null, { status: 400 });

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

  return new Response(null, {
    status: 202,
    headers: { "Cache-Control": "no-store" },
  });
}
