import { z } from "zod";

const opaqueId = z.string().min(1).max(191);

export const campaignEventTypeSchema = z.enum([
  "SCHEDULED",
  "SENT",
  "OPENED",
  "CLICKED",
  "SUBMITTED",
  "REPORTED",
  "FAILED",
]);

export const deliveryEventTypeSchema = z.enum([
  "QUEUED",
  "DISPATCH_STARTED",
  "ACCEPTED",
  "DEFERRED",
  "DELIVERED",
  "BOUNCED",
  "REJECTED",
  "RETRY_SCHEDULED",
  "DELIVERY_UNKNOWN",
  "CANCELLED",
]);

export const recipientDeliveryStatusSchema = z.enum([
  "PLANNED",
  "QUEUED",
  "DISPATCHING",
  "RETRYABLE",
  "SENT",
  "FAILED",
  "DELIVERY_UNKNOWN",
  "CANCELLED",
]);

export const negativeEventSeveritySchema = z.enum([
  "NONE",
  "OPENED",
  "CLICKED",
  "SUBMITTED",
]);

const versionedPayload = z.object({ version: z.literal(1) }).strict();

export const materializeOccurrencePayloadSchema = versionedPayload
  .extend({ occurrenceId: opaqueId })
  .strict();
export const feedDeliveriesPayloadSchema = versionedPayload
  .extend({ wakeId: opaqueId })
  .strict();
export const deliverRecipientPayloadSchema = versionedPayload
  .extend({ campaignRecipientId: opaqueId })
  .strict();
export const processDeliveryEventPayloadSchema = versionedPayload
  .extend({ deliveryEventId: opaqueId })
  .strict();

export const executionQueuePayloadSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("materialize-occurrence"),
      payload: materializeOccurrencePayloadSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("feed-deliveries"),
      payload: feedDeliveriesPayloadSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("deliver-recipient"),
      payload: deliverRecipientPayloadSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("process-delivery-event"),
      payload: processDeliveryEventPayloadSchema,
    })
    .strict(),
]);

export type CampaignEventType = z.infer<typeof campaignEventTypeSchema>;
export type DeliveryEventType = z.infer<typeof deliveryEventTypeSchema>;
export type RecipientDeliveryStatus = z.infer<
  typeof recipientDeliveryStatusSchema
>;
export type NegativeEventSeverity = z.infer<typeof negativeEventSeveritySchema>;
export type ExecutionQueuePayload = z.infer<typeof executionQueuePayloadSchema>;
