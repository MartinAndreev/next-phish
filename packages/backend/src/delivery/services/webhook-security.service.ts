import { createHmac, timingSafeEqual } from "node:crypto";

export function createWebhookSignature(
  secret: string,
  timestamp: string,
  rawBody: string,
): string {
  return createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`, "utf8")
    .digest("hex");
}

export function verifyWebhookSignature(input: {
  secret: string;
  timestamp: string;
  rawBody: string;
  signature: string;
  now?: Date;
  toleranceSeconds?: number;
}): boolean {
  const timestampSeconds = Number(input.timestamp);
  if (!Number.isSafeInteger(timestampSeconds)) return false;
  const nowSeconds = Math.floor((input.now ?? new Date()).getTime() / 1_000);
  if (Math.abs(nowSeconds - timestampSeconds) > (input.toleranceSeconds ?? 300))
    return false;
  const expected = createWebhookSignature(
    input.secret,
    input.timestamp,
    input.rawBody,
  );
  if (!/^[0-9a-f]{64}$/i.test(input.signature)) return false;
  return timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(input.signature, "hex"),
  );
}
