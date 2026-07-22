import {
  DeliveryEventType,
  type DeliveryEventType as DeliveryEventTypeValue,
} from "../execution.enums";
import { DeliveryRepository } from "../repositories/delivery.repository";

const acceptedTypes = new Set<DeliveryEventTypeValue>([
  DeliveryEventType.DELIVERED,
  DeliveryEventType.BOUNCED,
  DeliveryEventType.REJECTED,
  DeliveryEventType.DEFERRED,
]);

export class ProviderWebhookService {
  constructor(private readonly repository: DeliveryRepository) {}

  async accept(input: {
    providerMessageId: string;
    providerEventId: string;
    type: DeliveryEventTypeValue;
    occurredAt: Date;
    metadata?: Record<string, string | number | boolean | null>;
  }): Promise<{ accepted: boolean }> {
    if (!acceptedTypes.has(input.type)) return { accepted: false };
    const recipient = await this.repository.findByProviderMessageId(
      input.providerMessageId,
    );
    if (!recipient) return { accepted: false };
    const result = await this.repository.recordDeliveryEvent({
      campaignRecipientId: recipient.id,
      type: input.type,
      providerEventId: input.providerEventId,
      deduplicationKey: `provider:${input.providerEventId}`,
      occurredAt: input.occurredAt,
      metadata: input.metadata,
    });
    return { accepted: result.inserted };
  }
}
