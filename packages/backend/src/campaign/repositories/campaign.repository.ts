import { Prisma, type PrismaClient } from "@prisma/client";
import { CampaignService } from "../services";
import {
  calculateScheduledAt,
  createDeliveryIdempotencyKey,
  generateLogicalMessageId,
  generateTrackingRef,
  rewriteTrackedLinks,
  type DeliveryPacing,
} from "../../delivery";
import type {
  CampaignDefinitionInput,
  ScheduleDefinitionInput,
} from "../validations";

type Tx = Prisma.TransactionClient;

const campaignInclude = {
  emailTemplate: {
    select: {
      id: true,
      name: true,
      tags: true,
      visibility: true,
      status: true,
    },
  },
  page: {
    select: {
      id: true,
      name: true,
      type: true,
      visibility: true,
      status: true,
    },
  },
  mailSendingProfile: {
    select: {
      id: true,
      name: true,
      providerType: true,
      fromName: true,
      fromEmail: true,
      visibility: true,
    },
  },
  targetGroup: {
    select: {
      id: true,
      name: true,
      visibility: true,
      status: true,
      _count: { select: { users: true } },
    },
  },
} as const;

export class CampaignRepository {
  constructor(
    private readonly db: PrismaClient,
    private readonly service: CampaignService = new CampaignService(),
  ) {}

  listCampaigns(
    organizationId: string,
    input: {
      type?: "TEMPLATE" | "CONCRETE";
      status?: Prisma.EnumCampaignStatusFilter["equals"];
      search?: string;
      sort?: Array<{
        field: "name" | "type" | "status" | "createdAt" | "updatedAt";
        order: "asc" | "desc";
      }>;
      filters?: {
        type?: "TEMPLATE" | "CONCRETE";
        status?: Prisma.EnumCampaignStatusFilter["equals"];
      };
      limit: number;
      offset: number;
    },
  ) {
    const where: Prisma.CampaignWhereInput = {
      organizationId,
      type: input.filters?.type ?? input.type,
      status: input.filters?.status ?? input.status,
      name: input.search
        ? { contains: input.search, mode: "insensitive" }
        : undefined,
      scheduleId: null,
    };
    return Promise.all([
      this.db.campaign.findMany({
        where,
        include: campaignInclude,
        orderBy: input.sort?.length
          ? input.sort.map((sort) => ({ [sort.field]: sort.order }))
          : { updatedAt: "desc" },
        take: input.limit,
        skip: input.offset,
      }),
      this.db.campaign.count({ where }),
    ]).then(([rows, total]) => ({ rows, total }));
  }

  getCampaign(id: string, organizationId: string) {
    return this.db.campaign.findFirst({
      where: { id, organizationId },
      include: {
        ...campaignInclude,
        createdBy: { select: { id: true, name: true, email: true } },
        sourceCampaign: { select: { id: true, name: true } },
        schedule: true,
        scheduleSources: {
          include: { schedule: true },
          orderBy: { position: "asc" },
        },
        _count: { select: { clones: true } },
      },
    });
  }

  async createCampaign(
    organizationId: string,
    createdById: string,
    data: CampaignDefinitionInput,
  ) {
    await this.assertCatalogResources(this.db, organizationId, data);
    return this.db.campaign.create({
      data: { ...data, organizationId, createdById },
      include: campaignInclude,
    });
  }

  async updateCampaign(
    id: string,
    organizationId: string,
    data: CampaignDefinitionInput,
  ) {
    await this.assertCatalogResources(this.db, organizationId, data);
    const existing = await this.db.campaign.findFirst({
      where: { id, organizationId, scheduleId: null },
    });
    if (!existing) throw new Error("Campaign not found");
    if (!["DRAFT", "PUBLISHED"].includes(existing.status))
      throw new Error("Started campaigns cannot be edited");
    if (existing.status === "PUBLISHED" && data.status === "DRAFT")
      throw new Error("Published campaigns cannot return to draft");
    return this.db.campaign.update({
      where: { id },
      data: { ...data, brokenAt: null, brokenReason: null },
      include: campaignInclude,
    });
  }

  async publish(id: string, organizationId: string) {
    const result = await this.db.campaign.updateMany({
      where: { id, organizationId, status: "DRAFT", scheduleId: null },
      data: { status: "PUBLISHED" },
    });
    if (!result.count)
      throw new Error("Only a draft campaign can be published");
    return this.getCampaign(id, organizationId);
  }

  async cloneCampaign(
    id: string,
    organizationId: string,
    createdById: string,
    data: {
      name: string;
      type: "TEMPLATE" | "CONCRETE";
      targetGroupId: string | null;
    },
  ) {
    const source = await this.db.campaign.findFirst({
      where: { id, organizationId, scheduleId: null },
    });
    if (!source) throw new Error("Campaign not found");
    const definition = {
      name: data.name,
      tags: source.tags,
      type: data.type,
      status: "DRAFT" as const,
      emailTemplateId: source.emailTemplateId!,
      pageId: source.pageId!,
      mailSendingProfileId: source.mailSendingProfileId!,
      targetGroupId: data.type === "TEMPLATE" ? null : data.targetGroupId,
      targetTimezone: source.targetTimezone,
      autoCompleteAfterDays: source.autoCompleteAfterDays,
    } satisfies CampaignDefinitionInput;
    await this.assertCatalogResources(this.db, organizationId, definition);
    return this.db.campaign.create({
      data: {
        ...definition,
        organizationId,
        createdById,
        sourceCampaignId: source.id,
      },
      include: campaignInclude,
    });
  }

  listSchedules(
    organizationId: string,
    input: {
      search?: string;
      sort?: Array<{
        field: "name" | "type" | "status" | "startsAt";
        order: "asc" | "desc";
      }>;
      filters?: {
        type?: "ONE_TIME" | "RECURRING";
        status?: "DRAFT" | "SCHEDULED" | "RUNNING" | "COMPLETED" | "CANCELLED";
      };
      limit: number;
      offset: number;
    },
  ) {
    const where: Prisma.ScheduleWhereInput = {
      organizationId,
      type: input.filters?.type,
      status: input.filters?.status,
      name: input.search
        ? { contains: input.search, mode: "insensitive" }
        : undefined,
    };
    return Promise.all([
      this.db.schedule.findMany({
        where,
        include: {
          sources: {
            include: {
              campaign: { select: { id: true, name: true, type: true } },
            },
            orderBy: { position: "asc" },
          },
          targetGroup: {
            select: {
              id: true,
              name: true,
              _count: { select: { users: true } },
            },
          },
          _count: { select: { campaigns: true } },
        },
        orderBy: input.sort?.length
          ? input.sort.map((sort) => ({ [sort.field]: sort.order }))
          : { startsAt: "desc" },
        take: input.limit,
        skip: input.offset,
      }),
      this.db.schedule.count({ where }),
    ]).then(([rows, total]) => ({ rows, total }));
  }

  getScheduleTimeline(organizationId: string, startsAt: Date, endsAt: Date) {
    return Promise.all([
      this.db.schedule.findMany({
        where: {
          organizationId,
          status: { in: ["SCHEDULED", "RUNNING"] },
          startsAt: { lte: endsAt },
          OR: [{ endsAt: null }, { endsAt: { gte: startsAt } }],
        },
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          startsAt: true,
          endsAt: true,
          autoCompleteAfterDays: true,
        },
        orderBy: { startsAt: "asc" },
      }),
      this.db.campaign.findMany({
        where: {
          organizationId,
          status: { in: ["PENDING_START", "ACTIVE", "PAUSED"] },
          OR: [
            { occurrenceAt: { lte: endsAt } },
            { occurrenceAt: null, createdAt: { lte: endsAt } },
          ],
        },
        select: {
          id: true,
          name: true,
          status: true,
          occurrenceAt: true,
          createdAt: true,
          autoCompleteAfterDays: true,
        },
        orderBy: { occurrenceAt: "asc" },
      }),
    ]).then(([schedules, campaigns]) => ({ schedules, campaigns }));
  }

  getSchedule(id: string, organizationId: string) {
    return this.db.schedule.findFirst({
      where: { id, organizationId },
      include: {
        sources: { orderBy: { position: "asc" }, include: { campaign: true } },
        campaigns: { orderBy: { occurrenceAt: "desc" } },
        targetGroup: { include: { _count: { select: { users: true } } } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async createSchedule(
    organizationId: string,
    createdById: string,
    data: ScheduleDefinitionInput,
  ) {
    return this.db.$transaction(async (tx) => {
      const sources = await this.validateScheduleSources(
        tx,
        organizationId,
        data,
      );
      const fingerprint = this.service.createScheduleFingerprint(data);
      const collision = await tx.schedule.findFirst({
        where: {
          organizationId,
          collisionFingerprint: fingerprint,
          status: { not: "CANCELLED" },
        },
        select: { id: true, name: true },
      });
      const { sourceCampaignIds, ...scheduleData } = data;
      const schedule = await tx.schedule.create({
        data: {
          ...scheduleData,
          organizationId,
          createdById,
          status: "SCHEDULED",
          nextOccurrenceAt: data.startsAt,
          collisionFingerprint: fingerprint,
          targetGroupId: this.resolveScheduleTarget(data, sources),
          sources: {
            create: sourceCampaignIds.map((campaignId, position) => ({
              campaignId,
              position,
            })),
          },
        },
        include: { sources: true },
      });
      return {
        schedule,
        collisionWarning: collision
          ? { scheduleId: collision.id, scheduleName: collision.name }
          : null,
      };
    });
  }

  async updateSchedule(
    id: string,
    organizationId: string,
    data: ScheduleDefinitionInput,
  ) {
    return this.db.$transaction(async (tx) => {
      const schedule = await tx.schedule.findFirst({
        where: { id, organizationId },
      });
      if (!schedule) throw new Error("Schedule not found");
      if (["COMPLETED", "CANCELLED"].includes(schedule.status))
        throw new Error("Terminal schedules cannot be edited");
      const locked = await tx.campaign.count({
        where: {
          scheduleId: id,
          status: { in: ["PENDING_START", "ACTIVE", "PAUSED"] },
        },
      });
      if (locked)
        throw new Error(
          "Schedule fields are locked while a campaign is pending or active",
        );
      const sources = await this.validateScheduleSources(
        tx,
        organizationId,
        data,
      );
      const { sourceCampaignIds, ...scheduleData } = data;
      await tx.scheduleSource.deleteMany({ where: { scheduleId: id } });
      await tx.campaign.deleteMany({
        where: { scheduleId: id, status: "SCHEDULED" },
      });
      return tx.schedule.update({
        where: { id },
        data: {
          ...scheduleData,
          targetGroupId: this.resolveScheduleTarget(data, sources),
          nextOccurrenceAt: data.startsAt,
          collisionFingerprint: this.service.createScheduleFingerprint(data),
          brokenAt: null,
          brokenReason: null,
          revision: { increment: 1 },
          executionEnabled: true,
          sources: {
            create: sourceCampaignIds.map((campaignId, position) => ({
              campaignId,
              position,
            })),
          },
        },
        include: { sources: true },
      });
    });
  }

  async cancelSchedule(id: string, organizationId: string) {
    return this.db.$transaction(async (tx) => {
      const schedule = await tx.schedule.findFirst({
        where: { id, organizationId },
      });
      if (!schedule) throw new Error("Schedule not found");
      const campaigns = await tx.campaign.findMany({
        where: { scheduleId: id },
        select: { id: true },
      });
      const campaignIds = campaigns.map((campaign) => campaign.id);
      await tx.campaignRecipient.updateMany({
        where: {
          campaignId: { in: campaignIds },
          deliveryStatus: { in: ["PLANNED", "QUEUED", "RETRYABLE"] },
        },
        data: { deliveryStatus: "CANCELLED", cancelledAt: new Date() },
      });
      await tx.scheduleOccurrence.updateMany({
        where: { scheduleId: id, status: { in: ["PENDING", "FAILED"] } },
        data: { status: "CANCELLED" },
      });
      await tx.campaign.updateMany({
        where: {
          scheduleId: id,
          status: { in: ["SCHEDULED", "PENDING_START", "ACTIVE", "PAUSED"] },
        },
        data: { status: "COMPLETED" },
      });
      return tx.schedule.update({
        where: { id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          nextOccurrenceAt: null,
        },
      });
    });
  }

  async pauseCampaign(id: string, organizationId: string) {
    return this.transitionCampaign(
      id,
      organizationId,
      ["PENDING_START", "ACTIVE"],
      "PAUSED",
    );
  }

  async resumeCampaign(id: string, organizationId: string) {
    return this.transitionCampaign(id, organizationId, ["PAUSED"], "ACTIVE");
  }

  async completeCampaign(id: string, organizationId: string) {
    return this.transitionCampaign(
      id,
      organizationId,
      ["ACTIVE", "PAUSED"],
      "COMPLETED",
    );
  }

  async duplicateSchedule(
    id: string,
    organizationId: string,
    createdById: string,
  ) {
    const source = await this.getSchedule(id, organizationId);
    if (!source) throw new Error("Schedule not found");
    const data = {
      name: `${source.name} copy`,
      type: source.type,
      sourceCampaignIds: source.sources.map((item) => item.campaignId),
      targetGroupId: source.targetGroupId,
      targetTimezone: source.targetTimezone,
      startsAt: source.startsAt,
      frequency: source.frequency,
      localTimeMinutes: source.localTimeMinutes,
      weekday: source.weekday,
      dayOfMonth: source.dayOfMonth,
      month: source.month,
      selectionStrategy: source.selectionStrategy,
      shuffleDeck: source.shuffleDeck,
      deliveryMode: source.deliveryMode,
      dripEmailsPerMinute: source.dripEmailsPerMinute,
      batchSize: source.batchSize,
      batchIntervalMinutes: source.batchIntervalMinutes,
      maxCampaigns: source.maxCampaigns,
      endsAt: source.endsAt,
      autoCompleteAfterDays: source.autoCompleteAfterDays,
    } satisfies ScheduleDefinitionInput;
    return this.createSchedule(organizationId, createdById, data);
  }

  async materializeClaimedOccurrence(occurrenceId: string) {
    const occurrence = await this.db.scheduleOccurrence.findUnique({
      where: { id: occurrenceId },
      include: { schedule: { select: { createdById: true } } },
    });
    if (!occurrence) throw new Error("Schedule occurrence not found");
    if (occurrence.status === "COMPLETED" && occurrence.campaignId)
      return this.db.campaign.findUniqueOrThrow({
        where: { id: occurrence.campaignId },
        include: campaignInclude,
      });
    const claimed = await this.db.scheduleOccurrence.updateMany({
      where: {
        id: occurrenceId,
        status: { in: ["PENDING", "FAILED"] },
        OR: [{ leaseExpiresAt: null }, { leaseExpiresAt: { lt: new Date() } }],
      },
      data: {
        status: "MATERIALIZING",
        leaseOwner: `materialize:${process.pid}`,
        leaseExpiresAt: new Date(Date.now() + 5 * 60_000),
        attempts: { increment: 1 },
      },
    });
    if (!claimed.count) return null;
    try {
      return await this.materializeOccurrence(
        occurrence.scheduleId,
        occurrence.sourceCampaignId,
        occurrence.occurrenceAt,
        occurrence.organizationId,
        occurrence.schedule.createdById,
      );
    } catch (error) {
      await this.db.scheduleOccurrence.updateMany({
        where: { id: occurrenceId, status: "MATERIALIZING" },
        data: {
          status: "FAILED",
          leaseOwner: null,
          leaseExpiresAt: null,
          lastError:
            error instanceof Error
              ? error.message.slice(0, 500)
              : "Materialization failed",
        },
      });
      throw error;
    }
  }

  async materializeOccurrence(
    scheduleId: string,
    sourceCampaignId: string,
    occurrenceAt: Date,
    organizationId: string,
    createdById: string,
  ) {
    return this.db.$transaction(async (tx) => {
      const schedule = await tx.schedule.findFirst({
        where: {
          id: scheduleId,
          organizationId,
          status: { in: ["SCHEDULED", "RUNNING", "COMPLETED"] },
        },
        include: { sources: true },
      });
      if (
        !schedule ||
        !schedule.sources.some(
          (source) => source.campaignId === sourceCampaignId,
        )
      )
        throw new Error("Valid schedule source not found");

      const existing = await tx.campaign.findUnique({
        where: {
          scheduleId_occurrenceAt: { scheduleId, occurrenceAt },
        },
        include: campaignInclude,
      });
      if (existing) return existing;

      const source = await tx.campaign.findFirst({
        where: { id: sourceCampaignId, organizationId },
        include: {
          emailTemplate: { include: { files: { include: { file: true } } } },
          page: true,
          mailSendingProfile: true,
          targetGroup: { include: { users: { orderBy: { id: "asc" } } } },
        },
      });
      if (
        !source?.emailTemplate ||
        source.emailTemplate.visibility !== "CATALOG" ||
        source.emailTemplate.status !== "ACTIVE" ||
        !source.page ||
        source.page.visibility !== "CATALOG" ||
        source.page.status !== "ACTIVE" ||
        !source.mailSendingProfile ||
        source.mailSendingProfile.visibility !== "CATALOG"
      )
        throw new Error("Schedule source is broken");
      const targetGroup =
        source.type === "CONCRETE"
          ? source.targetGroup?.visibility === "CATALOG" &&
            source.targetGroup.status === "ACTIVE"
            ? source.targetGroup
            : null
          : await tx.targetGroup.findFirst({
              where: {
                id: schedule.targetGroupId ?? "",
                organizationId,
                visibility: "CATALOG",
                status: "ACTIVE",
              },
              include: { users: { orderBy: { id: "asc" } } },
            });
      if (!targetGroup) throw new Error("Target group is unavailable");
      const run = await tx.campaign.create({
        data: {
          organizationId,
          createdById,
          name: `${source.name} — ${occurrenceAt.toISOString()}`,
          tags: source.tags,
          type: "CONCRETE",
          status: "SCHEDULED",
          targetTimezone: schedule.targetTimezone,
          autoCompleteAfterDays: schedule.autoCompleteAfterDays,
          sourceCampaignId: source.id,
          scheduleId: schedule.id,
          occurrenceAt,
        },
      });

      const shadowFiles = new Map<string, string>();
      for (const link of source.emailTemplate.files) {
        const file = link.file;
        const shadow = await tx.file.create({
          data: {
            storedObjectId: file.storedObjectId,
            name: file.name,
            size: file.size,
            format: file.format,
            purpose: file.purpose,
            visibility: "SHADOW",
            organizationId,
            uploadedById: file.uploadedById,
            shadowCampaignId: run.id,
            sourceFileId: file.id,
          },
        });
        shadowFiles.set(file.id, shadow.id);
      }
      const email = source.emailTemplate;
      const shadowEmail = await tx.emailTemplate.create({
        data: {
          name: email.name,
          tags: email.tags,
          html: email.html,
          design: email.design as Prisma.InputJsonValue,
          organizationId,
          createdById: email.createdById,
          status: email.status,
          trackingPixel: email.trackingPixel,
          visibility: "SHADOW",
          contentRevision: email.contentRevision,
          shadowCampaignId: run.id,
          sourceTemplateId: email.id,
          files: {
            create: email.files.map((link) => ({
              fileId: shadowFiles.get(link.fileId)!,
            })),
          },
        },
      });
      const trackedContent = rewriteTrackedLinks(
        shadowEmail.html,
        process.env.PUBLIC_CONTENT_URL ?? "https://content.example.com",
      );
      if (trackedContent.links.length) {
        await tx.campaignTrackingLink.createMany({
          data: trackedContent.links.map((link) => ({
            campaignId: run.id,
            linkId: link.linkId,
            destinationUrl: link.destinationUrl,
          })),
        });
        await tx.emailTemplate.update({
          where: { id: shadowEmail.id },
          data: { html: trackedContent.html },
        });
      }
      const shadowPage = await this.clonePage(
        tx,
        source.page.id,
        organizationId,
        run.id,
        new Map(),
      );
      const profile = source.mailSendingProfile;
      const shadowProfile = await tx.mailSendingProfile.create({
        data: {
          organizationId,
          name: profile.name,
          providerType: profile.providerType,
          fromName: profile.fromName,
          fromEmail: profile.fromEmail,
          replyToEmail: profile.replyToEmail,
          headers:
            profile.headers === null
              ? undefined
              : (profile.headers as Prisma.InputJsonValue),
          providerConfig: profile.providerConfig as Prisma.InputJsonValue,
          isDefault: false,
          visibility: "SHADOW",
          shadowCampaignId: run.id,
          sourceSendingProfileId: profile.id,
        },
      });
      const seen = new Set<string>();
      const users = targetGroup.users.flatMap((user) => {
        const normalizedEmail = this.service.normalizeRecipientEmail(
          user.email,
        );
        if (seen.has(normalizedEmail)) return [];
        seen.add(normalizedEmail);
        return [
          {
            email: user.email.trim(),
            normalizedEmail,
            firstName: user.firstName,
            lastName: user.lastName,
            position: user.position,
          },
        ];
      });
      const shadowGroup = await tx.targetGroup.create({
        data: {
          name: targetGroup.name,
          status: targetGroup.status,
          organizationId,
          createdById: targetGroup.createdById,
          visibility: "SHADOW",
          shadowCampaignId: run.id,
          sourceTargetGroupId: targetGroup.id,
          users: { create: users },
        },
      });
      const pacing: DeliveryPacing =
        schedule.deliveryMode === "DRIP"
          ? {
              mode: "DRIP",
              emailsPerMinute: schedule.dripEmailsPerMinute!,
            }
          : schedule.deliveryMode === "BATCH"
            ? {
                mode: "BATCH",
                batchSize: schedule.batchSize!,
                batchIntervalMinutes: schedule.batchIntervalMinutes!,
              }
            : { mode: "BLAST" };
      const messageIdDomain =
        process.env.MESSAGE_ID_DOMAIN ?? "mail.example.com";
      for (const [index, user] of users.entries()) {
        let recipient = null;
        for (
          let collisionAttempt = 0;
          collisionAttempt < 8 && !recipient;
          collisionAttempt += 1
        ) {
          await tx.campaignRecipient.createMany({
            data: [
              {
                campaignId: run.id,
                organizationId,
                email: user.email,
                normalizedEmail: user.normalizedEmail,
                firstName: user.firstName,
                lastName: user.lastName,
                position: user.position,
                trackingRef: generateTrackingRef(),
                messageId: generateLogicalMessageId(messageIdDomain),
                idempotencyKey: createDeliveryIdempotencyKey(
                  run.id,
                  user.normalizedEmail,
                ),
                scheduledAt: calculateScheduledAt(occurrenceAt, index, pacing),
              },
            ],
            skipDuplicates: true,
          });
          recipient = await tx.campaignRecipient.findUnique({
            where: {
              campaignId_normalizedEmail: {
                campaignId: run.id,
                normalizedEmail: user.normalizedEmail,
              },
            },
          });
        }
        if (!recipient)
          throw new Error("Unable to allocate neutral identifiers");
        await tx.campaignEvent.upsert({
          where: { deduplicationKey: `recipient:${recipient.id}:scheduled` },
          create: {
            organizationId,
            campaignId: run.id,
            campaignRecipientId: recipient.id,
            type: "SCHEDULED",
            deduplicationKey: `recipient:${recipient.id}:scheduled`,
            occurredAt: new Date(),
          },
          update: {},
        });
      }
      const occurrence = await tx.scheduleOccurrence.findUnique({
        where: { scheduleId_occurrenceAt: { scheduleId, occurrenceAt } },
      });
      const campaign = await tx.campaign.update({
        where: { id: run.id },
        data: {
          emailTemplateId: shadowEmail.id,
          pageId: shadowPage.id,
          mailSendingProfileId: shadowProfile.id,
          targetGroupId: shadowGroup.id,
          expectedRecipientCount: users.length,
          materializedAt: new Date(),
        },
        include: campaignInclude,
      });
      if (occurrence) {
        await tx.scheduleOccurrence.update({
          where: { id: occurrence.id },
          data: {
            campaignId: run.id,
            status: "COMPLETED",
            materializedRecipientCount: users.length,
            completedAt: new Date(),
          },
        });
        await tx.outboxEvent.upsert({
          where: { deduplicationKey: `campaign:${run.id}:feed` },
          create: {
            organizationId,
            topic: "delivery-feeder",
            deduplicationKey: `campaign:${run.id}:feed`,
            payload: { version: 1, wakeId: run.id },
          },
          update: {},
        });
      }
      return campaign;
    });
  }

  private async clonePage(
    tx: Tx,
    sourceId: string,
    organizationId: string,
    campaignId: string,
    clones: Map<string, string>,
  ): Promise<{ id: string }> {
    const existingId = clones.get(sourceId);
    if (existingId) return { id: existingId };

    const source = await tx.page.findFirst({
      where: { id: sourceId, organizationId, visibility: "CATALOG" },
    });
    if (!source) throw new Error("Page is unavailable");

    const clone = await tx.page.create({
      data: {
        name: source.name,
        type: source.type,
        html: source.html,
        design: source.design ?? undefined,
        status: source.status,
        captureData: source.captureData,
        redirectUrl: source.redirectUrl,
        contentType: source.contentType,
        organizationId,
        createdById: source.createdById,
        visibility: "SHADOW",
        contentRevision: source.contentRevision,
        shadowCampaignId: campaignId,
        sourcePageId: source.id,
      },
      select: { id: true },
    });
    clones.set(sourceId, clone.id);

    if (source.redirectPageId) {
      const redirect = await this.clonePage(
        tx,
        source.redirectPageId,
        organizationId,
        campaignId,
        clones,
      );
      await tx.page.update({
        where: { id: clone.id },
        data: { redirectPageId: redirect.id },
      });
    }
    return clone;
  }

  private async transitionCampaign(
    id: string,
    organizationId: string,
    from: Array<"PENDING_START" | "ACTIVE" | "PAUSED">,
    to: "ACTIVE" | "PAUSED" | "COMPLETED",
  ) {
    const result = await this.db.campaign.updateMany({
      where: { id, organizationId, type: "CONCRETE", status: { in: from } },
      data: { status: to },
    });
    if (!result.count) throw new Error(`Campaign cannot transition to ${to}`);
    return this.getCampaign(id, organizationId);
  }

  private async assertCatalogResources(
    client: PrismaClient | Tx,
    organizationId: string,
    data: Pick<
      CampaignDefinitionInput,
      | "emailTemplateId"
      | "pageId"
      | "mailSendingProfileId"
      | "targetGroupId"
      | "type"
    >,
  ) {
    const email = await client.emailTemplate.findFirst({
      where: {
        id: data.emailTemplateId,
        organizationId,
        visibility: "CATALOG",
        status: "ACTIVE",
      },
      select: { id: true },
    });
    const page = await client.page.findFirst({
      where: {
        id: data.pageId,
        organizationId,
        visibility: "CATALOG",
        status: "ACTIVE",
      },
      select: { id: true },
    });
    const profile = await client.mailSendingProfile.findFirst({
      where: {
        id: data.mailSendingProfileId,
        organizationId,
        visibility: "CATALOG",
      },
      select: { id: true },
    });
    const group = data.targetGroupId
      ? await client.targetGroup.findFirst({
          where: {
            id: data.targetGroupId,
            organizationId,
            visibility: "CATALOG",
            status: "ACTIVE",
          },
          select: { id: true },
        })
      : null;
    if (!email || !page || !profile || (data.type === "CONCRETE" && !group))
      throw new Error(
        "Campaign resources must be active catalog resources in the organization",
      );
  }

  private async validateScheduleSources(
    tx: Tx,
    organizationId: string,
    data: ScheduleDefinitionInput,
  ) {
    const sources = await tx.campaign.findMany({
      where: {
        id: { in: data.sourceCampaignIds },
        organizationId,
        status: "PUBLISHED",
        scheduleId: null,
      },
      include: {
        emailTemplate: {
          select: { visibility: true, status: true },
        },
        page: { select: { visibility: true, status: true } },
        mailSendingProfile: { select: { visibility: true } },
        targetGroup: { select: { visibility: true, status: true } },
      },
    });
    if (sources.length !== new Set(data.sourceCampaignIds).size)
      throw new Error("One or more schedule sources are unavailable");
    if (
      sources.some(
        (source) =>
          source.emailTemplate?.visibility !== "CATALOG" ||
          source.emailTemplate.status !== "ACTIVE" ||
          source.page?.visibility !== "CATALOG" ||
          source.page.status !== "ACTIVE" ||
          source.mailSendingProfile?.visibility !== "CATALOG" ||
          (source.type === "CONCRETE" &&
            (source.targetGroup?.visibility !== "CATALOG" ||
              source.targetGroup.status !== "ACTIVE")),
      )
    )
      throw new Error("One or more schedule sources are broken");
    if (
      data.type === "RECURRING" &&
      sources.some((source) => source.type !== "TEMPLATE")
    )
      throw new Error("Repeating schedules only accept templates");
    if (
      sources.some((source) => source.type === "TEMPLATE") &&
      !data.targetGroupId
    )
      throw new Error("Template schedules require a target group");
    if (
      data.targetGroupId &&
      !(await tx.targetGroup.findFirst({
        where: {
          id: data.targetGroupId,
          organizationId,
          visibility: "CATALOG",
          status: "ACTIVE",
        },
      }))
    )
      throw new Error("Target group is unavailable");
    return sources;
  }

  private resolveScheduleTarget(
    data: ScheduleDefinitionInput,
    sources: Array<{ type: string; targetGroupId: string | null }>,
  ) {
    return sources[0]?.type === "CONCRETE"
      ? sources[0].targetGroupId
      : data.targetGroupId;
  }
}
