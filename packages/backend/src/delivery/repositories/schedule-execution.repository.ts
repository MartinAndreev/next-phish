import { Prisma, type PrismaClient } from "@prisma/client";
import { nextOccurrenceAfter } from "../services/recurrence.service";
import { selectScheduleSource } from "../services/source-selection.service";
import {
  ScheduleSelectionStrategy,
  ScheduleStatus,
  ScheduleType,
} from "../execution.enums";

export class ScheduleExecutionRepository {
  constructor(private readonly db: PrismaClient) {}

  async claimDueSchedules(limit = 50, now = new Date()) {
    const safeLimit = Math.max(1, Math.min(limit, 200));
    return this.db.$transaction(async (tx) => {
      const due = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        SELECT id
        FROM schedule
        WHERE status IN (
          ${ScheduleStatus.SCHEDULED}::"ScheduleStatus",
          ${ScheduleStatus.RUNNING}::"ScheduleStatus"
        )
          AND "executionEnabled" = true
          AND "nextOccurrenceAt" <= ${now}
        ORDER BY "nextOccurrenceAt"
        FOR UPDATE SKIP LOCKED
        LIMIT ${safeLimit}
      `);
      const occurrences = [];
      for (const row of due) {
        const schedule = await tx.schedule.findUniqueOrThrow({
          where: { id: row.id },
          include: { sources: { orderBy: { position: "asc" } } },
        });
        if (!schedule.nextOccurrenceAt || !schedule.sources.length) continue;

        let occurrenceAt = schedule.nextOccurrenceAt;
        let nextAt: Date | null = null;
        if (schedule.type === ScheduleType.RECURRING) {
          if (!schedule.frequency || schedule.localTimeMinutes === null)
            throw new Error(
              `Schedule ${schedule.id} has an invalid recurrence`,
            );
          // Default catch-up policy: retain only the latest due instant. The loop is
          // bounded defensively even for corrupted historical schedules.
          for (let count = 0; count < 1_000; count += 1) {
            const candidate = nextOccurrenceAfter(occurrenceAt, {
              frequency: schedule.frequency,
              timezone: schedule.targetTimezone,
              localTimeMinutes: schedule.localTimeMinutes,
              weekday: schedule.weekday,
              dayOfMonth: schedule.dayOfMonth,
              month: schedule.month,
            });
            nextAt = candidate;
            if (candidate > now) break;
            occurrenceAt = candidate;
          }
          if (!nextAt || nextAt <= now)
            throw new Error(`Schedule ${schedule.id} exceeded catch-up bound`);
        }

        const completedCount = await tx.scheduleOccurrence.count({
          where: { scheduleId: schedule.id },
        });
        const previousOccurrence = await tx.scheduleOccurrence.findFirst({
          where: { scheduleId: schedule.id },
          orderBy: { occurrenceAt: "desc" },
          select: { sourceCampaignId: true },
        });
        const selection = selectScheduleSource({
          scheduleId: schedule.id,
          strategy:
            schedule.selectionStrategy ?? ScheduleSelectionStrategy.DECK,
          sources: schedule.sources,
          occurrenceCount: completedCount,
          previousSourceCampaignId: previousOccurrence?.sourceCampaignId,
          shuffleDeck: schedule.shuffleDeck,
        });
        if (!selection.sourceCampaignId) {
          await tx.schedule.update({
            where: { id: schedule.id },
            data: {
              status: ScheduleStatus.COMPLETED,
              completedAt: now,
              nextOccurrenceAt: null,
            },
          });
          continue;
        }
        const sourceCampaignId = selection.sourceCampaignId;
        const reachesMax =
          schedule.maxCampaigns !== null &&
          completedCount + 1 >= schedule.maxCampaigns;
        const reachesEnd =
          nextAt !== null &&
          schedule.endsAt !== null &&
          nextAt > schedule.endsAt;
        const deckExhausted = selection.deckExhausted;
        const terminal =
          schedule.type === ScheduleType.ONE_TIME ||
          reachesMax ||
          reachesEnd ||
          deckExhausted;

        const occurrence = await tx.scheduleOccurrence.upsert({
          where: {
            scheduleId_occurrenceAt: {
              scheduleId: schedule.id,
              occurrenceAt,
            },
          },
          create: {
            scheduleId: schedule.id,
            organizationId: schedule.organizationId,
            occurrenceAt,
            scheduleRevision: schedule.revision,
            sourceCampaignId,
          },
          update: {},
        });
        await tx.outboxEvent.upsert({
          where: {
            deduplicationKey: `occurrence:${occurrence.id}:materialize`,
          },
          create: {
            organizationId: schedule.organizationId,
            topic: "materialization",
            deduplicationKey: `occurrence:${occurrence.id}:materialize`,
            payload: { version: 1, occurrenceId: occurrence.id },
          },
          update: {},
        });
        await tx.schedule.update({
          where: { id: schedule.id },
          data: {
            status: terminal
              ? ScheduleStatus.COMPLETED
              : ScheduleStatus.RUNNING,
            completedAt: terminal ? now : null,
            nextOccurrenceAt: terminal ? null : nextAt,
          },
        });
        occurrences.push(occurrence);
      }
      return occurrences;
    });
  }
}
