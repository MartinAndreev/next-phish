import type {
  CampaignEventType,
  NegativeEventSeverity,
  RecipientDeliveryStatus,
} from "@next-phish/shared";

const terminal = new Set<RecipientDeliveryStatus>([
  "SENT",
  "FAILED",
  "DELIVERY_UNKNOWN",
  "CANCELLED",
]);

const transitions: Record<RecipientDeliveryStatus, RecipientDeliveryStatus[]> =
  {
    PLANNED: ["QUEUED", "CANCELLED"],
    QUEUED: ["DISPATCHING", "CANCELLED"],
    DISPATCHING: ["SENT", "RETRYABLE", "FAILED", "DELIVERY_UNKNOWN"],
    RETRYABLE: ["QUEUED", "CANCELLED"],
    SENT: [],
    FAILED: [],
    DELIVERY_UNKNOWN: [],
    CANCELLED: [],
  };

const severity: Record<NegativeEventSeverity, number> = {
  NONE: 0,
  OPENED: 1,
  CLICKED: 2,
  SUBMITTED: 3,
};

export function isTerminalDeliveryStatus(
  status: RecipientDeliveryStatus,
): boolean {
  return terminal.has(status);
}

export function canTransitionDelivery(
  from: RecipientDeliveryStatus,
  to: RecipientDeliveryStatus,
): boolean {
  return transitions[from].includes(to);
}

export function assertDeliveryTransition(
  from: RecipientDeliveryStatus,
  to: RecipientDeliveryStatus,
): void {
  if (!canTransitionDelivery(from, to))
    throw new Error(`Invalid delivery transition: ${from} -> ${to}`);
}

export function negativeSeverityForEvent(
  type: CampaignEventType,
): NegativeEventSeverity | null {
  return type === "OPENED" || type === "CLICKED" || type === "SUBMITTED"
    ? type
    : null;
}

export function maxNegativeSeverity(
  current: NegativeEventSeverity,
  candidate: NegativeEventSeverity,
): NegativeEventSeverity {
  return severity[candidate] > severity[current] ? candidate : current;
}

export function calculateRetryAt(
  attempt: number,
  now = new Date(),
  random = Math.random,
): Date {
  const boundedAttempt = Math.max(1, Math.min(attempt, 10));
  const baseMs = Math.min(30 * 60_000, 5_000 * 2 ** (boundedAttempt - 1));
  const jitter = Math.floor(baseMs * 0.25 * random());
  return new Date(now.getTime() + baseMs + jitter);
}
