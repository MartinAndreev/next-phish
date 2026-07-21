import { randomUUID } from "node:crypto";
import { MailDispatcherService } from "../../mail-sending";
import { DeliveryRepository } from "../repositories/delivery.repository";
import { calculateRetryAt } from "./delivery-policy.service";

function render(html: string, values: Record<string, string>): string {
  return html.replace(/\{\{\s*([a-zA-Z]+)\s*\}\}/g, (match, key: string) =>
    Object.hasOwn(values, key) ? values[key]! : match,
  );
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
      !["PENDING_START", "ACTIVE"].includes(recipient.campaign.status)
    ) {
      await this.repository.transitionRecipient(
        campaignRecipientId,
        "DISPATCHING",
        { status: "CANCELLED", lastError: "Campaign is not send-eligible" },
      );
      return;
    }

    const attempt = await this.repository.startAttempt(campaignRecipientId);
    await this.repository.recordDeliveryEvent({
      campaignRecipientId,
      type: "DISPATCH_STARTED",
      deduplicationKey: `attempt:${attempt.id}:started`,
    });

    const publicHost = (
      process.env.PUBLIC_CONTENT_URL ?? "https://content.example.com"
    ).replace(/\/$/, "");
    let html = render(recipient.campaign.emailTemplate.html, {
      firstName: recipient.firstName,
      lastName: recipient.lastName,
      email: recipient.email,
      position: recipient.position ?? "",
      trackingRef: recipient.trackingRef,
    });
    if (recipient.campaign.emailTemplate.trackingPixel) {
      html += `<img src="${publicHost}/p.gif?ref=${encodeURIComponent(recipient.trackingRef)}" alt="" width="1" height="1" style="display:none" />`;
    }

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
        outcome: "RETRYABLE",
        errorCode: "DISPATCH_SETUP_FAILED",
        sanitizedError: sanitized,
      });
      await this.repository.transitionRecipient(
        campaignRecipientId,
        "DISPATCHING",
        { status: "RETRYABLE", retryAt, lastError: sanitized },
      );
      await this.repository.recordDeliveryEvent({
        campaignRecipientId,
        type: "RETRY_SCHEDULED",
        deduplicationKey: `attempt:${attempt.id}:retryable`,
      });
      return;
    }

    if (result.success) {
      await this.repository.completeAttempt(attempt.id, {
        outcome: "ACCEPTED",
        providerMessageId: result.providerMessageId,
      });
      await this.repository.transitionRecipient(
        campaignRecipientId,
        "DISPATCHING",
        { status: "SENT", providerMessageId: result.providerMessageId },
      );
      await this.repository.recordDeliveryEvent({
        campaignRecipientId,
        type: "ACCEPTED",
        deduplicationKey: `attempt:${attempt.id}:accepted`,
      });
      await this.repository.recordCampaignEvent({
        campaignRecipientId,
        type: "SENT",
        deduplicationKey: `recipient:${campaignRecipientId}:sent`,
      });
      return;
    }

    const code = result.errorCode ?? "PROVIDER_ERROR";
    const error = sanitizeError(result.errorMessage);
    const statusCode = Number(code.match(/(\d{3})/)?.[1]);
    const isThrottle = statusCode === 429;
    const isServerFailure = statusCode >= 500 && statusCode <= 599;
    const isSafeRetry =
      result.provider === "GENERAL_API" &&
      (code === "API_SEND_FAILED" || isThrottle || isServerFailure);
    const isPermanent = statusCode >= 400 && statusCode < 500 && !isThrottle;
    const nextStatus = isSafeRetry
      ? "RETRYABLE"
      : isPermanent
        ? "FAILED"
        : "DELIVERY_UNKNOWN";

    await this.repository.completeAttempt(attempt.id, {
      outcome: nextStatus,
      errorCode: code,
      sanitizedError: error,
    });
    await this.repository.transitionRecipient(
      campaignRecipientId,
      "DISPATCHING",
      {
        status: nextStatus,
        retryAt:
          nextStatus === "RETRYABLE"
            ? calculateRetryAt(recipient.attemptCount)
            : undefined,
        lastError: error,
      },
    );
    await this.repository.recordDeliveryEvent({
      campaignRecipientId,
      type:
        nextStatus === "RETRYABLE"
          ? "RETRY_SCHEDULED"
          : nextStatus === "FAILED"
            ? "REJECTED"
            : "DELIVERY_UNKNOWN",
      deduplicationKey: `attempt:${attempt.id}:${nextStatus.toLowerCase()}`,
    });
    if (nextStatus === "FAILED")
      await this.repository.recordCampaignEvent({
        campaignRecipientId,
        type: "FAILED",
        deduplicationKey: `recipient:${campaignRecipientId}:failed`,
      });
  }
}
