import type {
  CampaignEventType as CampaignEventTypeValue,
  DeliveryEventType as DeliveryEventTypeValue,
} from "@next-phish/shared";
import { Prisma, type PrismaClient } from "@prisma/client";
import {
  maxNegativeSeverity,
  negativeSeverityForEvent,
} from "../services/delivery-policy.service";
import {
  CampaignEventType,
  CampaignStatus,
  DeliveryEventType,
  OccurrenceStatus,
  OutboxStatus,
  RecipientDeliveryStatus,
  ScheduleStatus,
  type NegativeEventSeverity as NegativeEventSeverityValue,
  type RecipientDeliveryStatus as RecipientDeliveryStatusValue,
} from "../execution.enums";

export class DeliveryRepository {
  constructor(private readonly db: PrismaClient) {}

  setOrganizationDeliveryEnabled(
    organizationId: string,
    deliveryEnabled: boolean,
  ) {
    return this.db.organization.update({
      where: { id: organizationId },
      data: { deliveryEnabled },
      select: { id: true, deliveryEnabled: true },
    });
  }

  async setCampaignDeliveryEnabled(
    organizationId: string,
    campaignId: string,
    deliveryEnabled: boolean,
  ) {
    const result = await this.db.campaign.updateMany({
      where: { id: campaignId, organizationId },
      data: { deliveryEnabled },
    });
    if (!result.count) throw new Error("Campaign not found");
    return { id: campaignId, deliveryEnabled };
  }

  async listCampaignRecipients(input: {
    organizationId: string;
    campaignId: string;
    limit: number;
    offset: number;
  }) {
    const where = {
      organizationId: input.organizationId,
      campaignId: input.campaignId,
    };
    const [rows, total] = await Promise.all([
      this.db.campaignRecipient.findMany({
        where,
        orderBy: [{ scheduledAt: "asc" }, { id: "asc" }],
        take: input.limit,
        skip: input.offset,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          position: true,
          scheduledAt: true,
          deliveryStatus: true,
          sentAt: true,
          failedAt: true,
          attemptCount: true,
          highestNegativeEvent: true,
          highestNegativeEventAt: true,
          reported: true,
          reportedAt: true,
        },
      }),
      this.db.campaignRecipient.count({ where }),
    ]);
    return { rows, total };
  }

  listCampaignEvents(input: {
    organizationId: string;
    campaignId: string;
    campaignRecipientId?: string;
    limit: number;
    offset: number;
  }) {
    return this.db.campaignEvent.findMany({
      where: {
        organizationId: input.organizationId,
        campaignId: input.campaignId,
        campaignRecipientId: input.campaignRecipientId,
      },
      orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
      take: input.limit,
      skip: input.offset,
      select: {
        id: true,
        campaignRecipientId: true,
        type: true,
        occurredAt: true,
      },
    });
  }

  listDeliveryEvents(input: {
    organizationId: string;
    campaignId: string;
    campaignRecipientId?: string;
    limit: number;
    offset: number;
  }) {
    return this.db.deliveryEvent.findMany({
      where: {
        organizationId: input.organizationId,
        campaignId: input.campaignId,
        campaignRecipientId: input.campaignRecipientId,
      },
      orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
      take: input.limit,
      skip: input.offset,
      select: {
        id: true,
        campaignRecipientId: true,
        type: true,
        occurredAt: true,
        metadata: true,
      },
    });
  }

  async getExecutionOperations(organizationId: string) {
    const now = new Date();
    const [
      dueSchedules,
      oldestDueSchedule,
      pendingOutbox,
      oldestOutbox,
      deliveryUnknown,
      failedRecipients,
      occurrenceStates,
    ] = await Promise.all([
      this.db.schedule.count({
        where: {
          organizationId,
          executionEnabled: true,
          status: {
            in: [ScheduleStatus.SCHEDULED, ScheduleStatus.RUNNING],
          },
          nextOccurrenceAt: { lte: now },
        },
      }),
      this.db.schedule.findFirst({
        where: {
          organizationId,
          executionEnabled: true,
          status: {
            in: [ScheduleStatus.SCHEDULED, ScheduleStatus.RUNNING],
          },
          nextOccurrenceAt: { lte: now },
        },
        orderBy: { nextOccurrenceAt: "asc" },
        select: { nextOccurrenceAt: true },
      }),
      this.db.outboxEvent.count({
        where: {
          organizationId,
          status: { in: [OutboxStatus.PENDING, OutboxStatus.FAILED] },
        },
      }),
      this.db.outboxEvent.findFirst({
        where: {
          organizationId,
          status: { in: [OutboxStatus.PENDING, OutboxStatus.FAILED] },
        },
        orderBy: { availableAt: "asc" },
        select: { availableAt: true },
      }),
      this.db.campaignRecipient.count({
        where: {
          organizationId,
          deliveryStatus: RecipientDeliveryStatus.DELIVERY_UNKNOWN,
        },
      }),
      this.db.campaignRecipient.count({
        where: {
          organizationId,
          deliveryStatus: RecipientDeliveryStatus.FAILED,
        },
      }),
      this.db.scheduleOccurrence.groupBy({
        by: ["status"],
        where: { organizationId },
        _count: { _all: true },
      }),
    ]);
    return {
      dueSchedules,
      scheduleLagMs: oldestDueSchedule?.nextOccurrenceAt
        ? Math.max(
            0,
            now.getTime() - oldestDueSchedule.nextOccurrenceAt.getTime(),
          )
        : 0,
      pendingOutbox,
      outboxLagMs: oldestOutbox
        ? Math.max(0, now.getTime() - oldestOutbox.availableAt.getTime())
        : 0,
      deliveryUnknown,
      failedRecipients,
      occurrenceStates,
    };
  }

  async getCampaignExecutionSummary(
    organizationId: string,
    campaignId: string,
  ) {
    const campaign = await this.db.campaign.findFirst({
      where: { id: campaignId, organizationId },
      select: {
        id: true,
        status: true,
        materializedAt: true,
        expectedRecipientCount: true,
      },
    });
    if (!campaign) return null;
    const [delivery, negative, reported] = await Promise.all([
      this.db.campaignRecipient.groupBy({
        by: ["deliveryStatus"],
        where: { campaignId, organizationId },
        _count: { _all: true },
      }),
      this.db.campaignRecipient.groupBy({
        by: ["highestNegativeEvent"],
        where: { campaignId, organizationId },
        _count: { _all: true },
      }),
      this.db.campaignRecipient.count({
        where: { campaignId, organizationId, reported: true },
      }),
    ]);
    return { campaign, delivery, negative, reported };
  }

  listIgnoredNetworks(organizationId: string | null) {
    return this.db.ignoredNetwork.findMany({
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
    organizationId: string | null;
    createdById: string;
    network: string;
    normalizedNetwork: string;
    description?: string;
  }) {
    return this.db.$transaction(async (tx) => {
      const network = await tx.ignoredNetwork.create({ data });
      if (data.organizationId) {
        await tx.ignoredNetworkAudit.create({
          data: {
            organizationId: data.organizationId,
            ignoredNetworkId: network.id,
            action: "CREATED",
            normalizedNetwork: data.normalizedNetwork,
            description: data.description,
            actorId: data.createdById,
          },
        });
      }
      return network;
    });
  }

  deleteIgnoredNetwork(
    id: string,
    organizationId: string | null,
    actorId: string,
  ) {
    return this.db.$transaction(async (tx) => {
      const network = await tx.ignoredNetwork.findFirst({
        where: { id, organizationId },
      });
      if (!network) return { count: 0 };
      if (organizationId) {
        await tx.ignoredNetworkAudit.create({
          data: {
            organizationId,
            ignoredNetworkId: network.id,
            action: "DELETED",
            normalizedNetwork: network.normalizedNetwork,
            description: network.description,
            actorId,
          },
        });
      }
      return tx.ignoredNetwork.deleteMany({
        where: { id, organizationId },
      });
    });
  }

  listIgnoredNetworkAudits(organizationId: string) {
    return this.db.ignoredNetworkAudit.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        ignoredNetworkId: true,
        action: true,
        normalizedNetwork: true,
        description: true,
        actorId: true,
        createdAt: true,
      },
    });
  }

  async recordCampaignEvent(input: {
    campaignRecipientId: string;
    type: CampaignEventTypeValue;
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
            recipient.highestNegativeEvent as NegativeEventSeverityValue;
          const next = candidate
            ? maxNegativeSeverity(current, candidate)
            : current;
          await tx.campaignRecipient.update({
            where: { id: recipient.id },
            data: {
              highestNegativeEvent: next,
              highestNegativeEventAt: next !== current ? occurredAt : undefined,
              reported:
                input.type === CampaignEventType.REPORTED ? true : undefined,
              reportedAt:
                input.type === CampaignEventType.REPORTED && !recipient.reported
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
    type: DeliveryEventTypeValue;
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

  async cleanupExecutionHistory(now = new Date()) {
    const deliveryBefore = new Date(
      now.getTime() -
        Number(process.env.DELIVERY_EVENT_RETENTION_DAYS ?? 90) * 86_400_000,
    );
    const attemptBefore = new Date(
      now.getTime() -
        Number(process.env.DELIVERY_ATTEMPT_RETENTION_DAYS ?? 30) * 86_400_000,
    );
    const outboxBefore = new Date(
      now.getTime() -
        Number(process.env.OUTBOX_RETENTION_DAYS ?? 7) * 86_400_000,
    );
    const [deliveryEvents, attempts, trackingEvents, outbox] =
      await this.db.$transaction([
        this.db.deliveryEvent.deleteMany({
          where: { createdAt: { lt: deliveryBefore } },
        }),
        this.db.deliveryAttempt.deleteMany({
          where: { completedAt: { lt: attemptBefore } },
        }),
        this.db.trackingEventInbox.deleteMany({
          where: { processedAt: { lt: outboxBefore } },
        }),
        this.db.outboxEvent.deleteMany({
          where: {
            status: OutboxStatus.PUBLISHED,
            publishedAt: { lt: outboxBefore },
          },
        }),
      ]);
    return {
      deliveryEvents: deliveryEvents.count,
      attempts: attempts.count,
      trackingEvents: trackingEvents.count,
      outbox: outbox.count,
    };
  }

  async recoverExpiredLeases(now = new Date()) {
    return this.db.$transaction(async (tx) => {
      const expired = await tx.campaignRecipient.findMany({
        where: {
          deliveryStatus: RecipientDeliveryStatus.DISPATCHING,
          leaseExpiresAt: { lt: now },
        },
        select: { id: true, organizationId: true, campaignId: true },
        take: 500,
      });
      for (const recipient of expired) {
        await tx.campaignRecipient.updateMany({
          where: {
            id: recipient.id,
            deliveryStatus: RecipientDeliveryStatus.DISPATCHING,
          },
          data: {
            deliveryStatus: RecipientDeliveryStatus.DELIVERY_UNKNOWN,
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
            type: DeliveryEventType.DELIVERY_UNKNOWN,
            deduplicationKey: `recipient:${recipient.id}:expired-lease`,
            occurredAt: now,
          },
          update: {},
        });
      }
      await tx.scheduleOccurrence.updateMany({
        where: {
          status: OccurrenceStatus.MATERIALIZING,
          leaseExpiresAt: { lt: now },
        },
        data: {
          status: OccurrenceStatus.FAILED,
          leaseOwner: null,
          leaseExpiresAt: null,
          lastError: "Materialization lease expired",
        },
      });
      await tx.campaign.updateMany({
        where: {
          status: CampaignStatus.PENDING_START,
          recipients: { some: { dispatchStartedAt: { not: null } } },
        },
        data: { status: CampaignStatus.ACTIVE },
      });
      return expired.length;
    });
  }

  async feedNearTerm(horizon: Date, limit = 500) {
    if (process.env.DELIVERY_ENABLED === "false") return 0;
    const safeLimit = Math.max(1, Math.min(limit, 2_000));
    const recipients = await this.db.$queryRaw<
      Array<{
        id: string;
        organizationId: string;
        campaignId: string;
        scheduledAt: Date;
      }>
    >(Prisma.sql`
      SELECT ranked.id,
             ranked."organizationId",
             ranked."campaignId",
             ranked."scheduledAt"
      FROM (
        SELECT recipient.id,
               recipient."organizationId",
               recipient."campaignId",
               recipient."scheduledAt",
               ROW_NUMBER() OVER (
                 PARTITION BY recipient."organizationId"
                 ORDER BY recipient."scheduledAt", recipient.id
               ) AS tenant_rank
        FROM "campaign_recipient" recipient
        JOIN campaign ON campaign.id = recipient."campaignId"
        JOIN organization ON organization.id = recipient."organizationId"
        WHERE recipient."deliveryStatus" =
              ${RecipientDeliveryStatus.PLANNED}::"RecipientDeliveryStatus"
          AND recipient."scheduledAt" <= ${horizon}
          AND campaign.status IN (
            ${CampaignStatus.SCHEDULED}::"CampaignStatus",
            ${CampaignStatus.PENDING_START}::"CampaignStatus",
            ${CampaignStatus.ACTIVE}::"CampaignStatus"
          )
          AND campaign."deliveryEnabled" = true
          AND organization."deliveryEnabled" = true
      ) ranked
      ORDER BY ranked.tenant_rank, ranked."scheduledAt", ranked.id
      LIMIT ${safeLimit}
    `);
    if (!recipients.length) return 0;
    await this.db.$transaction(async (tx) => {
      for (const recipient of recipients) {
        const queued = await tx.campaignRecipient.updateMany({
          where: {
            id: recipient.id,
            deliveryStatus: RecipientDeliveryStatus.PLANNED,
          },
          data: {
            deliveryStatus: RecipientDeliveryStatus.QUEUED,
            queuedAt: new Date(),
          },
        });
        if (!queued.count) continue;
        await tx.deliveryEvent.upsert({
          where: { deduplicationKey: `recipient:${recipient.id}:queued` },
          create: {
            organizationId: recipient.organizationId,
            campaignId: recipient.campaignId,
            campaignRecipientId: recipient.id,
            type: DeliveryEventType.QUEUED,
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
          status: CampaignStatus.SCHEDULED,
        },
        data: { status: CampaignStatus.PENDING_START },
      });
    });
    return recipients.length;
  }

  findByProviderMessageId(providerMessageId: string) {
    return this.db.campaignRecipient.findFirst({
      where: { providerMessageId },
      select: { id: true },
    });
  }

  getRecipientForDelivery(id: string) {
    return this.db.campaignRecipient.findUnique({
      where: { id },
      include: {
        campaign: {
          include: {
            emailTemplate: true,
            page: { select: { path: true } },
            mailSendingProfile: true,
            organization: { select: { deliveryEnabled: true } },
          },
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
    if (process.env.DELIVERY_ENABLED === "false") return false;
    const now = new Date();
    return this.db.$transaction(async (tx) => {
      const result = await tx.campaignRecipient.updateMany({
        where: {
          id,
          deliveryStatus: {
            in: [
              RecipientDeliveryStatus.QUEUED,
              RecipientDeliveryStatus.RETRYABLE,
            ],
          },
          scheduledAt: { lte: now },
          OR: [{ leaseExpiresAt: null }, { leaseExpiresAt: { lt: now } }],
          campaign: {
            status: {
              in: [CampaignStatus.PENDING_START, CampaignStatus.ACTIVE],
            },
            deliveryEnabled: true,
            organization: { deliveryEnabled: true },
          },
        },
        data: {
          deliveryStatus: RecipientDeliveryStatus.DISPATCHING,
          leaseOwner,
          leaseExpiresAt: new Date(now.getTime() + leaseMs),
          dispatchStartedAt: now,
          attemptCount: { increment: 1 },
        },
      });
      if (!result.count) return false;

      const recipient = await tx.campaignRecipient.findUniqueOrThrow({
        where: { id },
        select: { campaignId: true },
      });
      await tx.campaign.updateMany({
        where: {
          id: recipient.campaignId,
          status: CampaignStatus.PENDING_START,
        },
        data: { status: CampaignStatus.ACTIVE },
      });
      return true;
    });
  }

  async transitionRecipient(
    id: string,
    from: RecipientDeliveryStatusValue,
    data: {
      status: RecipientDeliveryStatusValue;
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
          sentAt:
            data.status === RecipientDeliveryStatus.SENT ? now : undefined,
          failedAt:
            data.status === RecipientDeliveryStatus.FAILED ||
            data.status === RecipientDeliveryStatus.DELIVERY_UNKNOWN
              ? now
              : undefined,
          cancelledAt:
            data.status === RecipientDeliveryStatus.CANCELLED ? now : undefined,
        },
      });
      if (
        result.count &&
        data.status === RecipientDeliveryStatus.RETRYABLE &&
        data.retryAt
      ) {
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
