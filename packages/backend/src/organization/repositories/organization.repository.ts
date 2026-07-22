import type { PrismaClient } from "@next-phish/database";
import { Prisma } from "@prisma/client";
import type {
  MemberView,
  OrganizationAnalyticsMonth,
  OrganizationDashboardView,
  OrganizationWithMembers,
} from "../types";

const memberSelect = {
  id: true,
  userId: true,
  role: true,
  createdAt: true,
} as const;

interface FindByUserIdInput {
  search?: string;
  limit: number;
  offset: number;
  sort?: Array<{ field: string; order: "asc" | "desc" }>;
  filters?: { role?: string };
}

interface FindMembersInput {
  search?: string;
  limit: number;
  offset: number;
  sort?: Array<{ field: string; order: "asc" | "desc" }>;
  filters?: { role?: string };
}

export class OrganizationRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByUserId(
    userId: string,
    input: FindByUserIdInput,
  ): Promise<{ rows: OrganizationWithMembers[]; total: number }> {
    const where: Record<string, unknown> = {
      members: { some: { userId } },
    };

    if (input.search) {
      where.name = { contains: input.search, mode: "insensitive" as const };
    }

    if (input.filters?.role) {
      where.members = {
        some: {
          userId,
          role: input.filters.role,
        },
      };
    }

    const orderBy = input.sort?.length
      ? input.sort.map((s) => ({ [s.field]: s.order }))
      : [{ name: "asc" as const }];

    const [rows, total] = await Promise.all([
      this.db.organization.findMany({
        where,
        include: {
          members: { where: { userId }, select: memberSelect },
        },
        orderBy,
        take: input.limit,
        skip: input.offset,
      }),
      this.db.organization.count({ where }),
    ]);

    return { rows: rows as OrganizationWithMembers[], total };
  }

  async findById(id: string): Promise<OrganizationWithMembers | null> {
    return this.db.organization.findUnique({
      where: { id },
      include: {
        members: { select: memberSelect },
      },
    }) as Promise<OrganizationWithMembers | null>;
  }

  async getDashboard(
    organizationId: string,
  ): Promise<OrganizationDashboardView> {
    const periodDays = 30;
    const periodEnd = new Date();
    const periodStart = new Date(periodEnd);
    periodStart.setUTCDate(periodStart.getUTCDate() - periodDays);

    const recipientWhere = {
      organizationId,
      scheduledAt: { gte: periodStart, lte: periodEnd },
    };
    const [
      organization,
      activeCampaigns,
      brokenCampaigns,
      campaignCount,
      targetGroupCount,
      emailTemplateCount,
      pageCount,
      sendingProfileCount,
      deliveryGroups,
      negativeGroups,
      reportedRecipients,
    ] = await Promise.all([
      this.db.organization.findUniqueOrThrow({
        where: { id: organizationId },
        select: { deliveryEnabled: true },
      }),
      this.db.campaign.count({
        where: {
          organizationId,
          type: "CONCRETE",
          status: { in: ["PENDING_START", "ACTIVE"] },
        },
      }),
      this.db.campaign.count({
        where: {
          organizationId,
          OR: [{ brokenAt: { not: null } }, { status: "FAILED" }],
        },
      }),
      this.db.campaign.count({ where: { organizationId } }),
      this.db.targetGroup.count({ where: { organizationId } }),
      this.db.emailTemplate.count({ where: { organizationId } }),
      this.db.page.count({ where: { organizationId } }),
      this.db.mailSendingProfile.count({ where: { organizationId } }),
      this.db.campaignRecipient.groupBy({
        by: ["deliveryStatus"],
        where: recipientWhere,
        _count: { _all: true },
      }),
      this.db.campaignRecipient.groupBy({
        by: ["highestNegativeEvent"],
        where: recipientWhere,
        _count: { _all: true },
      }),
      this.db.campaignRecipient.count({
        where: { ...recipientWhere, reported: true },
      }),
    ]);

    const delivery = Object.fromEntries(
      deliveryGroups.map((group) => [group.deliveryStatus, group._count._all]),
    ) as Record<string, number>;
    const negative = Object.fromEntries(
      negativeGroups.map((group) => [
        group.highestNegativeEvent,
        group._count._all,
      ]),
    ) as Record<string, number>;
    const recipientsTargeted = Object.values(delivery).reduce(
      (sum, count) => sum + count,
      0,
    );
    const delivered = delivery.SENT ?? 0;
    const opened =
      (negative.OPENED ?? 0) +
      (negative.CLICKED ?? 0) +
      (negative.SUBMITTED ?? 0);
    const riskRecipients = (negative.CLICKED ?? 0) + (negative.SUBMITTED ?? 0);
    const submitted = negative.SUBMITTED ?? 0;
    const percentage = (value: number) =>
      delivered ? Math.round((value / delivered) * 1000) / 10 : 0;

    return {
      periodDays,
      metrics: {
        activeCampaigns,
        recipientsTargeted,
        delivered,
        deliveryRate: recipientsTargeted
          ? Math.round((delivered / recipientsTargeted) * 1000) / 10
          : 0,
        riskRecipients,
        riskRate: percentage(riskRecipients),
        reportedRecipients,
        reportingRate: percentage(reportedRecipients),
      },
      funnel: {
        scheduled: recipientsTargeted,
        sent: delivered,
        opened,
        clicked: riskRecipients,
        submitted,
        reported: reportedRecipients,
      },
      attention: {
        deliveryDisabled: !organization.deliveryEnabled,
        brokenCampaigns,
        failedDeliveries: delivery.FAILED ?? 0,
      },
      readiness: {
        campaigns: campaignCount,
        targetGroups: targetGroupCount,
        emailTemplates: emailTemplateCount,
        pages: pageCount,
        sendingProfiles: sendingProfileCount,
      },
    };
  }

  async getAnalytics(
    organizationId: string,
  ): Promise<OrganizationAnalyticsMonth[]> {
    return this.db.$queryRaw<OrganizationAnalyticsMonth[]>(Prisma.sql`
      WITH months AS (
        SELECT generate_series(
          date_trunc('month', CURRENT_TIMESTAMP) - interval '5 months',
          date_trunc('month', CURRENT_TIMESTAMP),
          interval '1 month'
        ) AS month_start
      ),
      campaign_counts AS (
        SELECT date_trunc('month', "createdAt") AS month_start, count(*)::int AS campaigns
        FROM "campaign"
        WHERE "organizationId" = ${organizationId}
          AND "createdAt" >= date_trunc('month', CURRENT_TIMESTAMP) - interval '5 months'
        GROUP BY 1
      ),
      event_counts AS (
        SELECT
          date_trunc('month', "occurredAt") AS month_start,
          count(*) FILTER (WHERE "type" = 'SENT')::int AS sent,
          count(*) FILTER (WHERE "type" = 'OPENED')::int AS opened,
          count(*) FILTER (WHERE "type" = 'CLICKED')::int AS clicked,
          count(*) FILTER (WHERE "type" = 'SUBMITTED')::int AS submitted,
          count(*) FILTER (WHERE "type" = 'REPORTED')::int AS reported,
          count(*) FILTER (WHERE "type" = 'FAILED')::int AS failed
        FROM "campaign_event"
        WHERE "organizationId" = ${organizationId}
          AND "occurredAt" >= date_trunc('month', CURRENT_TIMESTAMP) - interval '5 months'
        GROUP BY 1
      )
      SELECT
        to_char(months.month_start, 'YYYY-MM') AS month,
        coalesce(campaign_counts.campaigns, 0)::int AS campaigns,
        coalesce(event_counts.sent, 0)::int AS sent,
        coalesce(event_counts.opened, 0)::int AS opened,
        coalesce(event_counts.clicked, 0)::int AS clicked,
        coalesce(event_counts.submitted, 0)::int AS submitted,
        coalesce(event_counts.reported, 0)::int AS reported,
        coalesce(event_counts.failed, 0)::int AS failed
      FROM months
      LEFT JOIN campaign_counts USING (month_start)
      LEFT JOIN event_counts USING (month_start)
      ORDER BY months.month_start
    `);
  }

  async update(
    id: string,
    data: { name: string; slug: string },
  ): Promise<OrganizationWithMembers> {
    return this.db.organization.update({
      where: { id },
      data,
      include: { members: { select: memberSelect } },
    }) as Promise<OrganizationWithMembers>;
  }

  async findFirstByUserId(
    userId: string,
  ): Promise<{ organizationId: string } | null> {
    return this.db.member.findFirst({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: { organizationId: true },
    });
  }

  async findMembersByOrganizationId(
    organizationId: string,
    input: FindMembersInput,
  ): Promise<{ rows: MemberView[]; total: number }> {
    const where: Record<string, unknown> = { organizationId };

    if (input.search) {
      where.user = {
        OR: [
          { name: { contains: input.search, mode: "insensitive" as const } },
          { email: { contains: input.search, mode: "insensitive" as const } },
        ],
      };
    }

    if (input.filters?.role) {
      where.role = input.filters.role;
    }

    const orderBy = input.sort?.length
      ? input.sort.map((s) => ({ [s.field]: s.order }))
      : [{ createdAt: "desc" as const }];

    const [rows, total] = await Promise.all([
      this.db.member.findMany({
        where,
        include: { user: { select: { name: true, email: true, image: true } } },
        orderBy,
        take: input.limit,
        skip: input.offset,
      }),
      this.db.member.count({ where }),
    ]);

    return { rows: rows as MemberView[], total };
  }

  async countByUserIdAndOrgIds(
    userId: string,
    organizationIds: string[],
  ): Promise<number> {
    return this.db.member.count({
      where: {
        userId,
        organizationId: { in: organizationIds },
      },
    });
  }
}
