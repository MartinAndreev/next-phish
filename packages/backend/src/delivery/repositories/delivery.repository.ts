import type {
  CampaignEventType,
  DeliveryEventType,
  NegativeEventSeverity,
  RecipientDeliveryStatus,
} from "@next-phish/shared";
import { Prisma, type PrismaClient } from "@prisma/client";
import {
  maxNegativeSeverity,
  negativeSeverityForEvent,
} from "../services/delivery-policy.service";

export class DeliveryRepository {
  constructor(private readonly db: PrismaClient) {}

  listIgnoredNetworks(organizationId: string) {
    return this.db.organizationIgnoredNetwork.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        network: true,
        normalizedNetwork: true,
        description: true,
        createdAt: true,
      },
    });
  }

  createIgnoredNetwork(data: {
    organizationId: string;
    createdById: string;
    network: string;
    normalizedNetwork: string;
    description?: string;
  }) {
    return this.db.organizationIgnoredNetwork.create({ data });
  }

  deleteIgnoredNetwork(id: string, organizationId: string) {
    return this.db.organizationIgnoredNetwork.deleteMany({
      where: { id, organizationId },
    });
  }

  async recordCampaignEvent(input: {
    campaignRecipientId: string;
    type: CampaignEventType;
    deduplicationKey: string;
    occurredAt?: Date;
  }): Promise<{ inserted: boolean }> {
    const occurredAt = input.occurredAt ?? new Date();
    try {
      return await this.db.$transaction(
        async (tx) => {
          const recipient = await tx.campaignRecipient.findUniqueOrThrow({
            where: { id: input.campaignRecipientId },
            select: {
              id: true,
              campaignId: true,
              organizationId: true,
              highestNegativeEvent: true,
              reported: true,
            },
          });
          await tx.campaignEvent.create({
            data: {
              organizationId: recipient.organizationId,
              campaignId: recipient.campaignId,
              campaignRecipientId: recipient.id,
              type: input.type,
              deduplicationKey: input.deduplicationKey,
              occurredAt,
            },
          });

          const candidate = negativeSeverityForEvent(input.type);
          const current =
            recipient.highestNegativeEvent as NegativeEventSeverity;
          const next = candidate
            ? maxNegativeSeverity(current, candidate)
            : current;
          await tx.campaignRecipient.update({
            where: { id: recipient.id },
            data: {
              highestNegativeEvent: next,
              highestNegativeEventAt: next !== current ? occurredAt : undefined,
              reported: input.type === "REPORTED" ? true : undefined,
              reportedAt:
                input.type === "REPORTED" && !recipient.reported
                  ? occurredAt
                  : undefined,
            },
          });
          return { inserted: true };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      )
        return { inserted: false };
      throw error;
    }
  }

  async recordDeliveryEvent(input: {
    campaignRecipientId: string;
    type: DeliveryEventType;
    deduplicationKey: string;
    providerEventId?: string;
    metadata?: Prisma.InputJsonValue;
    occurredAt?: Date;
  }): Promise<{ inserted: boolean }> {
    const recipient = await this.db.campaignRecipient.findUniqueOrThrow({
      where: { id: input.campaignRecipientId },
      select: { id: true, campaignId: true, organizationId: true },
    });
    try {
      await this.db.deliveryEvent.create({
        data: {
          ...input,
          organizationId: recipient.organizationId,
          campaignId: recipient.campaignId,
          occurredAt: input.occurredAt ?? new Date(),
        },
      });
      return { inserted: true };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      )
        return { inserted: false };
      throw error;
    }
  }

  async recoverExpiredLeases(now = new Date()) {
    return this.db.$transaction(async (tx) => {
      const expired = await tx.campaignRecipient.findMany({
        where: {
          deliveryStatus: "DISPATCHING",
          leaseExpiresAt: { lt: now },
        },
        select: { id: true, organizationId: true, campaignId: true },
        take: 500,
      });
      for (const recipient of expired) {
        await tx.campaignRecipient.updateMany({
          where: { id: recipient.id, deliveryStatus: "DISPATCHING" },
          data: {
            deliveryStatus: "DELIVERY_UNKNOWN",
            failedAt: now,
            leaseOwner: null,
            leaseExpiresAt: null,
            lastError: "Delivery lease expired after dispatch began",
          },
        });
        await tx.deliveryEvent.upsert({
          where: {
            deduplicationKey: `recipient:${recipient.id}:expired-lease`,
          },
          create: {
            organizationId: recipient.organizationId,
            campaignId: recipient.campaignId,
            campaignRecipientId: recipient.id,
            type: "DELIVERY_UNKNOWN",
            deduplicationKey: `recipient:${recipient.id}:expired-lease`,
            occurredAt: now,
          },
          update: {},
        });
      }
      await tx.scheduleOccurrence.updateMany({
        where: { status: "MATERIALIZING", leaseExpiresAt: { lt: now } },
        data: {
          status: "FAILED",
          leaseOwner: null,
          leaseExpiresAt: null,
          lastError: "Materialization lease expired",
        },
      });
      return expired.length;
    });
  }

  async feedNearTerm(horizon: Date, limit = 500) {
    const recipients = await this.db.campaignRecipient.findMany({
      where: {
        deliveryStatus: "PLANNED",
        scheduledAt: { lte: horizon },
        campaign: { status: { in: ["SCHEDULED", "PENDING_START", "ACTIVE"] } },
      },
      orderBy: [
        { organizationId: "asc" },
        { scheduledAt: "asc" },
        { id: "asc" },
      ],
      take: Math.max(1, Math.min(limit, 2_000)),
      select: {
        id: true,
        organizationId: true,
        campaignId: true,
        scheduledAt: true,
      },
    });
    if (!recipients.length) return 0;
    await this.db.$transaction(async (tx) => {
      for (const recipient of recipients) {
        const queued = await tx.campaignRecipient.updateMany({
          where: { id: recipient.id, deliveryStatus: "PLANNED" },
          data: { deliveryStatus: "QUEUED", queuedAt: new Date() },
        });
        if (!queued.count) continue;
        await tx.deliveryEvent.upsert({
          where: { deduplicationKey: `recipient:${recipient.id}:queued` },
          create: {
            organizationId: recipient.organizationId,
            campaignId: recipient.campaignId,
            campaignRecipientId: recipient.id,
            type: "QUEUED",
            deduplicationKey: `recipient:${recipient.id}:queued`,
            occurredAt: new Date(),
          },
          update: {},
        });
        await tx.outboxEvent.upsert({
          where: { deduplicationKey: `recipient:${recipient.id}:deliver` },
          create: {
            organizationId: recipient.organizationId,
            topic: "delivery",
            deduplicationKey: `recipient:${recipient.id}:deliver`,
            payload: { version: 1, campaignRecipientId: recipient.id },
            availableAt: recipient.scheduledAt,
          },
          update: {},
        });
      }
      await tx.campaign.updateMany({
        where: {
          id: { in: [...new Set(recipients.map((item) => item.campaignId))] },
          status: "SCHEDULED",
        },
        data: { status: "PENDING_START" },
      });
    });
    return recipients.length;
  }

  getRecipientForDelivery(id: string) {
    return this.db.campaignRecipient.findUnique({
      where: { id },
      include: {
        campaign: {
          include: { emailTemplate: true, mailSendingProfile: true },
        },
      },
    });
  }

  findByTrackingRef(trackingRef: string) {
    return this.db.campaignRecipient.findUnique({
      where: { trackingRef },
      include: {
        campaign: {
          select: { status: true, pageId: true, organizationId: true },
        },
      },
    });
  }

  async startAttempt(campaignRecipientId: string) {
    const recipient = await this.db.campaignRecipient.findUniqueOrThrow({
      where: { id: campaignRecipientId },
      select: { attemptCount: true },
    });
    return this.db.deliveryAttempt.upsert({
      where: {
        campaignRecipientId_attemptNumber: {
          campaignRecipientId,
          attemptNumber: recipient.attemptCount,
        },
      },
      create: {
        campaignRecipientId,
        attemptNumber: recipient.attemptCount,
      },
      update: {},
    });
  }

  completeAttempt(
    id: string,
    data: {
      outcome: string;
      providerMessageId?: string;
      errorCode?: string;
      sanitizedError?: string;
    },
  ) {
    return this.db.deliveryAttempt.update({
      where: { id },
      data: { ...data, completedAt: new Date() },
    });
  }

  async claimRecipient(
    id: string,
    leaseOwner: string,
    leaseMs: number,
  ): Promise<boolean> {
    const now = new Date();
    const result = await this.db.campaignRecipient.updateMany({
      where: {
        id,
        deliveryStatus: { in: ["QUEUED", "RETRYABLE"] },
        scheduledAt: { lte: now },
        OR: [{ leaseExpiresAt: null }, { leaseExpiresAt: { lt: now } }],
        campaign: { status: { in: ["PENDING_START", "ACTIVE"] } },
      },
      data: {
        deliveryStatus: "DISPATCHING",
        leaseOwner,
        leaseExpiresAt: new Date(now.getTime() + leaseMs),
        dispatchStartedAt: now,
        attemptCount: { increment: 1 },
      },
    });
    return result.count === 1;
  }

  async transitionRecipient(
    id: string,
    from: RecipientDeliveryStatus,
    data: {
      status: RecipientDeliveryStatus;
      providerMessageId?: string;
      retryAt?: Date;
      lastError?: string;
    },
  ) {
    const now = new Date();
    return this.db.$transaction(async (tx) => {
      const result = await tx.campaignRecipient.updateMany({
        where: { id, deliveryStatus: from },
        data: {
          deliveryStatus: data.status,
          providerMessageId: data.providerMessageId,
          retryAt: data.retryAt,
          lastError: data.lastError,
          leaseOwner: null,
          leaseExpiresAt: null,
          sentAt: data.status === "SENT" ? now : undefined,
          failedAt:
            data.status === "FAILED" || data.status === "DELIVERY_UNKNOWN"
              ? now
              : undefined,
          cancelledAt: data.status === "CANCELLED" ? now : undefined,
        },
      });
      if (result.count && data.status === "RETRYABLE" && data.retryAt) {
        const recipient = await tx.campaignRecipient.findUniqueOrThrow({
          where: { id },
          select: { organizationId: true, attemptCount: true },
        });
        await tx.outboxEvent.upsert({
          where: {
            deduplicationKey: `recipient:${id}:retry:${recipient.attemptCount}`,
          },
          create: {
            organizationId: recipient.organizationId,
            topic: "delivery",
            deduplicationKey: `recipient:${id}:retry:${recipient.attemptCount}`,
            payload: { version: 1, campaignRecipientId: id },
            availableAt: data.retryAt,
          },
          update: {},
        });
      }
      return result;
    });
  }
}
