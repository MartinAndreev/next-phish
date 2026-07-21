import { Prisma, type PrismaClient } from "@prisma/client";

export interface ClaimedOutboxEvent {
  id: string;
  topic: string;
  deduplicationKey: string;
  payloadVersion: number;
  payload: Prisma.JsonValue;
}

export class OutboxRepository {
  constructor(private readonly db: PrismaClient) {}

  async claimBatch(
    workerId: string,
    limit = 100,
  ): Promise<ClaimedOutboxEvent[]> {
    const safeLimit = Math.max(1, Math.min(limit, 500));
    return this.db.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        SELECT id
        FROM "outbox_event"
        WHERE status IN ('PENDING', 'FAILED', 'PUBLISHING')
          AND "availableAt" <= NOW()
          AND ("claimedAt" IS NULL OR "claimedAt" < NOW() - INTERVAL '5 minutes')
        ORDER BY "availableAt", "createdAt"
        FOR UPDATE SKIP LOCKED
        LIMIT ${safeLimit}
      `);
      if (!rows.length) return [];
      const ids = rows.map((row) => row.id);
      await tx.outboxEvent.updateMany({
        where: { id: { in: ids } },
        data: {
          status: "PUBLISHING",
          claimedBy: workerId,
          claimedAt: new Date(),
          attempts: { increment: 1 },
        },
      });
      return tx.outboxEvent.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          topic: true,
          deduplicationKey: true,
          payloadVersion: true,
          payload: true,
        },
        orderBy: { availableAt: "asc" },
      });
    });
  }

  acknowledge(id: string, workerId: string) {
    return this.db.outboxEvent.updateMany({
      where: { id, claimedBy: workerId, status: "PUBLISHING" },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
        claimedBy: null,
        claimedAt: null,
        lastError: null,
      },
    });
  }

  fail(id: string, workerId: string, error: string) {
    return this.db.outboxEvent.updateMany({
      where: { id, claimedBy: workerId, status: "PUBLISHING" },
      data: {
        status: "FAILED",
        availableAt: new Date(Date.now() + 30_000),
        claimedBy: null,
        claimedAt: null,
        lastError: error.slice(0, 500),
      },
    });
  }

  cleanup(before: Date) {
    return this.db.outboxEvent.deleteMany({
      where: { status: "PUBLISHED", publishedAt: { lt: before } },
    });
  }
}
