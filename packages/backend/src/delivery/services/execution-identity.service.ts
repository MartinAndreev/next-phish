import { createHash, randomBytes } from "node:crypto";

const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const BLOCKED_MARKERS = ["phish", "simulation", "next-phish", "security-test"];

export function assertNeutralDomain(domain: string): string {
  const normalized = domain.trim().toLowerCase().replace(/\.$/, "");
  if (
    !/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(
      normalized,
    ) ||
    BLOCKED_MARKERS.some((marker) => normalized.includes(marker))
  ) {
    throw new Error("A valid neutral domain is required");
  }
  return normalized;
}

export function generateTrackingRef(): string {
  let result = "";
  while (result.length < 12) {
    const bytes = randomBytes(16);
    for (const byte of bytes) {
      // Discard the incomplete tail to avoid modulo bias.
      if (byte >= 248) continue;
      result += BASE62[byte % BASE62.length];
      if (result.length === 12) break;
    }
  }
  return result;
}

export function generateLogicalMessageId(domain: string): string {
  const neutralDomain = assertNeutralDomain(domain);
  const opaque = randomBytes(24).toString("base64url").toLowerCase();
  return `<${opaque}@${neutralDomain}>`;
}

export function createDeliveryIdempotencyKey(
  campaignId: string,
  normalizedEmail: string,
): string {
  return createHash("sha256")
    .update(`${campaignId}\0${normalizedEmail}`, "utf8")
    .digest("hex");
}

export function stableJobId(deduplicationKey: string): string {
  return createHash("sha256").update(deduplicationKey).digest("hex");
}

export function assertSafeHeaderValue(value: string): void {
  if (/[\r\n]/.test(value))
    throw new Error("Header values cannot contain CR/LF");
}
