import { randomUUID } from "node:crypto";
import { MailDispatcherService } from "../../mail-sending";
import { DeliveryRepository } from "../repositories/delivery.repository";
import { calculateRetryAt } from "./delivery-policy.service";
import { DistributedRateLimiterService } from "./distributed-rate-limiter.service";
import { getPublicContentUrl } from "./execution-identity.service";
import {
  CampaignEventType,
  CampaignStatus,
  DeliveryEventType,
  RecipientDeliveryStatus,
} from "../execution.enums";

function render(html: string, values: Record<string, string>): string {
  return html.replace(/\{\{\s*([a-zA-Z]+)\s*\}\}/g, (match, key: string) =>
    Object.hasOwn(values, key) ? values[key]! : match,
  );
}

export function renderDeliveryHtml(input: {
  templateHtml: string;
  publicContentUrl: string;
  pagePath: string | null;
  trackingPixel: boolean;
  recipient: {
    firstName: string;
    lastName: string;
    email: string;
    position: string | null;
    trackingRef: string;
  };
}): string {
  const landingPath = input.pagePath ?? "c";
  const landingUrl = `${input.publicContentUrl}/${landingPath}?ref=${encodeURIComponent(input.recipient.trackingRef)}`;
  let html = render(input.templateHtml, {
    firstName: input.recipient.firstName,
    lastName: input.recipient.lastName,
    email: input.recipient.email,
    position: input.recipient.position ?? "",
    trackingRef: input.recipient.trackingRef,
    url: landingUrl,
    URL: landingUrl,
  });
  if (input.trackingPixel)
    html += `<img src="${input.publicContentUrl}/p.gif?ref=${encodeURIComponent(input.recipient.trackingRef)}" alt="" width="1" height="1" style="display:none" />`;
  return html;
}

function sanitizeError(value: string | undefined): string | undefined {
  return value
    ?.replace(/[\w.+-]+@[\w.-]+/g, "[redacted]")
    .replace(/([?&]ref=)[^&\s]+/gi, "$1[redacted]")
    .slice(0, 500);
}

export class DeliveryProcessorService {
  constructor(
    private readonly repository: DeliveryRepository,
    private readonly dispatcher: MailDispatcherService,
    private readonly rateLimiter: DistributedRateLimiterService,
  ) {}

  async process(campaignRecipientId: string): Promise<void> {
    const leaseOwner = `delivery:${process.pid}:${randomUUID()}`;
    if (
      !(await this.repository.claimRecipient(
        campaignRecipientId,
        leaseOwner,
        2 * 60_000,
      ))
    )
      return;

    const recipient =
      await this.repository.getRecipientForDelivery(campaignRecipientId);
    if (
      !recipient?.campaign.emailTemplate ||
      !recipient.campaign.mailSendingProfile ||
      !recipient.campaign.deliveryEnabled ||
      !recipient.campaign.organization.deliveryEnabled ||
      (recipient.campaign.status !== CampaignStatus.PENDING_START &&
        recipient.campaign.status !== CampaignStatus.ACTIVE)
    ) {
      await this.repository.transitionRecipient(
        campaignRecipientId,
        RecipientDeliveryStatus.DISPATCHING,
        {
          status: RecipientDeliveryStatus.CANCELLED,
          lastError: "Campaign is not send-eligible",
        },
      );
      return;
    }

    const providerKey = `provider:${recipient.campaign.mailSendingProfile.providerType}`;
    const circuit = await this.rateLimiter.isCircuitOpen(providerKey);
    if (circuit.open) {
      const retryAt = new Date(Date.now() + circuit.retryAfterMs);
      await this.repository.transitionRecipient(
        campaignRecipientId,
        RecipientDeliveryStatus.DISPATCHING,
        {
          status: RecipientDeliveryStatus.RETRYABLE,
          retryAt,
          lastError: "Provider is deferred",
        },
      );
      await this.repository.recordDeliveryEvent({
        campaignRecipientId,
        type: DeliveryEventType.DEFERRED,
        deduplicationKey: `recipient:${campaignRecipientId}:circuit:${retryAt.getTime()}`,
        metadata: { reason: "circuit_open" },
      });
      return;
    }

    const rate = await this.rateLimiter.consumeAll([
      {
        key: `organization:${recipient.organizationId}`,
        max: Number(process.env.ORGANIZATION_DELIVERY_RATE_MAX ?? 600),
        durationMs: 60_000,
      },
      {
        key: providerKey,
        max: Number(process.env.PROVIDER_DELIVERY_RATE_MAX ?? 300),
        durationMs: 60_000,
      },
      {
        key: `profile:${recipient.campaign.mailSendingProfile.sourceSendingProfileId ?? recipient.campaign.mailSendingProfile.id}`,
        max: Number(process.env.PROFILE_DELIVERY_RATE_MAX ?? 120),
        durationMs: 60_000,
      },
    ]);
    if (!rate.allowed) {
      const retryAt = new Date(Date.now() + rate.retryAfterMs);
      await this.repository.transitionRecipient(
        campaignRecipientId,
        RecipientDeliveryStatus.DISPATCHING,
        {
          status: RecipientDeliveryStatus.RETRYABLE,
          retryAt,
          lastError: "Delivery rate deferred",
        },
      );
      await this.repository.recordDeliveryEvent({
        campaignRecipientId,
        type: DeliveryEventType.DEFERRED,
        deduplicationKey: `recipient:${campaignRecipientId}:deferred:${retryAt.getTime()}`,
        metadata: { reason: "rate_limit" },
      });
      return;
    }

    const attempt = await this.repository.startAttempt(campaignRecipientId);
    await this.repository.recordDeliveryEvent({
      campaignRecipientId,
      type: "DISPATCH_STARTED",
      deduplicationKey: `attempt:${attempt.id}:started`,
    });

    const publicHost = getPublicContentUrl();
    const html = renderDeliveryHtml({
      templateHtml: recipient.campaign.emailTemplate.html,
      publicContentUrl: publicHost,
      pagePath: recipient.campaign.page?.path ?? null,
      trackingPixel: recipient.campaign.emailTemplate.trackingPixel,
      recipient,
    });

    let result;
    try {
      result = await this.dispatcher.dispatch(
        recipient.campaign.mailSendingProfile.id,
        recipient.organizationId,
        {
          fromName: recipient.campaign.mailSendingProfile.fromName,
          fromEmail: recipient.campaign.mailSendingProfile.fromEmail,
          replyToEmail:
            recipient.campaign.mailSendingProfile.replyToEmail ?? undefined,
          to: [recipient.email],
          subject: "Information",
          html,
          headers: (recipient.campaign.mailSendingProfile.headers ??
            {}) as Record<string, string>,
          messageId: recipient.messageId,
          idempotencyKey: recipient.idempotencyKey,
        },
      );
    } catch (error) {
      const retryAt = calculateRetryAt(recipient.attemptCount);
      const sanitized = sanitizeError(
        error instanceof Error ? error.message : "Dispatch setup failed",
      );
      await this.repository.completeAttempt(attempt.id, {
        outcome: RecipientDeliveryStatus.RETRYABLE,
        errorCode: "DISPATCH_SETUP_FAILED",
        sanitizedError: sanitized,
      });
      await this.repository.transitionRecipient(
        campaignRecipientId,
        RecipientDeliveryStatus.DISPATCHING,
        {
          status: RecipientDeliveryStatus.RETRYABLE,
          retryAt,
          lastError: sanitized,
        },
      );
      await this.repository.recordDeliveryEvent({
        campaignRecipientId,
        type: DeliveryEventType.RETRY_SCHEDULED,
        deduplicationKey: `attempt:${attempt.id}:retryable`,
      });
      return;
    }

    if (result.success) {
      await this.rateLimiter.recordSuccess(providerKey);
      await this.repository.completeAttempt(attempt.id, {
        outcome: DeliveryEventType.ACCEPTED,
        providerMessageId: result.providerMessageId,
      });
      await this.repository.transitionRecipient(
        campaignRecipientId,
        RecipientDeliveryStatus.DISPATCHING,
        {
          status: RecipientDeliveryStatus.SENT,
          providerMessageId: result.providerMessageId,
        },
      );
      await this.repository.recordDeliveryEvent({
        campaignRecipientId,
        type: DeliveryEventType.ACCEPTED,
        deduplicationKey: `attempt:${attempt.id}:accepted`,
      });
      await this.repository.recordCampaignEvent({
        campaignRecipientId,
        type: CampaignEventType.SENT,
        deduplicationKey: `recipient:${campaignRecipientId}:sent`,
      });
      return;
    }

    const code = result.errorCode ?? "PROVIDER_ERROR";
    if (result.failureKind === "THROTTLED")
      await this.rateLimiter.recordThrottle({ key: providerKey });
    const error = sanitizeError(result.errorMessage);
    const maxAttempts = Math.max(
      1,
      Number(process.env.DELIVERY_MAX_ATTEMPTS ?? 5),
    );
    const safelyRetryable =
      result.failureKind === "SAFE_TRANSIENT" ||
      result.failureKind === "THROTTLED";
    const retriesExhausted = recipient.attemptCount >= maxAttempts;
    const nextStatus =
      safelyRetryable && !retriesExhausted
        ? RecipientDeliveryStatus.RETRYABLE
        : result.failureKind === "PERMANENT" || retriesExhausted
          ? RecipientDeliveryStatus.FAILED
          : RecipientDeliveryStatus.DELIVERY_UNKNOWN;

    await this.repository.completeAttempt(attempt.id, {
      outcome: nextStatus,
      errorCode: code,
      sanitizedError: error,
    });
    await this.repository.transitionRecipient(
      campaignRecipientId,
      RecipientDeliveryStatus.DISPATCHING,
      {
        status: nextStatus,
        retryAt:
          nextStatus === RecipientDeliveryStatus.RETRYABLE
            ? calculateRetryAt(recipient.attemptCount)
            : undefined,
        lastError: error,
      },
    );
    await this.repository.recordDeliveryEvent({
      campaignRecipientId,
      type:
        nextStatus === RecipientDeliveryStatus.RETRYABLE
          ? DeliveryEventType.RETRY_SCHEDULED
          : nextStatus === RecipientDeliveryStatus.FAILED
            ? DeliveryEventType.REJECTED
            : DeliveryEventType.DELIVERY_UNKNOWN,
      deduplicationKey: `attempt:${attempt.id}:${nextStatus.toLowerCase()}`,
    });
    if (nextStatus === RecipientDeliveryStatus.FAILED)
      await this.repository.recordCampaignEvent({
        campaignRecipientId,
        type: CampaignEventType.FAILED,
        deduplicationKey: `recipient:${campaignRecipientId}:failed`,
      });
  }
}
