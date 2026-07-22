import type { CampaignEventType as CampaignEventTypeValue } from "@next-phish/shared";
import {
  CampaignEventType,
  NegativeEventSeverity,
  RecipientDeliveryStatus,
  type NegativeEventSeverity as NegativeEventSeverityValue,
  type RecipientDeliveryStatus as RecipientDeliveryStatusValue,
} from "../execution.enums";

const terminal = new Set<RecipientDeliveryStatusValue>([
  RecipientDeliveryStatus.SENT,
  RecipientDeliveryStatus.FAILED,
  RecipientDeliveryStatus.DELIVERY_UNKNOWN,
  RecipientDeliveryStatus.CANCELLED,
]);

const transitions: Record<
  RecipientDeliveryStatusValue,
  RecipientDeliveryStatusValue[]
> = {
  [RecipientDeliveryStatus.PLANNED]: [
    RecipientDeliveryStatus.QUEUED,
    RecipientDeliveryStatus.CANCELLED,
  ],
  [RecipientDeliveryStatus.QUEUED]: [
    RecipientDeliveryStatus.DISPATCHING,
    RecipientDeliveryStatus.CANCELLED,
  ],
  [RecipientDeliveryStatus.DISPATCHING]: [
    RecipientDeliveryStatus.SENT,
    RecipientDeliveryStatus.RETRYABLE,
    RecipientDeliveryStatus.FAILED,
    RecipientDeliveryStatus.DELIVERY_UNKNOWN,
  ],
  [RecipientDeliveryStatus.RETRYABLE]: [
    RecipientDeliveryStatus.QUEUED,
    RecipientDeliveryStatus.CANCELLED,
  ],
  [RecipientDeliveryStatus.SENT]: [],
  [RecipientDeliveryStatus.FAILED]: [],
  [RecipientDeliveryStatus.DELIVERY_UNKNOWN]: [],
  [RecipientDeliveryStatus.CANCELLED]: [],
};

const severity: Record<NegativeEventSeverityValue, number> = {
  [NegativeEventSeverity.NONE]: 0,
  [NegativeEventSeverity.OPENED]: 1,
  [NegativeEventSeverity.CLICKED]: 2,
  [NegativeEventSeverity.SUBMITTED]: 3,
};

export function isTerminalDeliveryStatus(
  status: RecipientDeliveryStatusValue,
): boolean {
  return terminal.has(status);
}

export function canTransitionDelivery(
  from: RecipientDeliveryStatusValue,
  to: RecipientDeliveryStatusValue,
): boolean {
  return transitions[from].includes(to);
}

export function assertDeliveryTransition(
  from: RecipientDeliveryStatusValue,
  to: RecipientDeliveryStatusValue,
): void {
  if (!canTransitionDelivery(from, to))
    throw new Error(`Invalid delivery transition: ${from} -> ${to}`);
}

export function negativeSeverityForEvent(
  type: CampaignEventTypeValue,
): NegativeEventSeverityValue | null {
  return type === CampaignEventType.OPENED ||
    type === CampaignEventType.CLICKED ||
    type === CampaignEventType.SUBMITTED
    ? type
    : null;
}

export function maxNegativeSeverity(
  current: NegativeEventSeverityValue,
  candidate: NegativeEventSeverityValue,
): NegativeEventSeverityValue {
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
