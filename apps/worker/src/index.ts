import "./container";
import type { Job } from "bullmq";
import { Queue, Worker } from "bullmq";
import {
  Container,
  DeliveryProcessorService,
  DeliveryRepository,
  ImportTargetGroupUsersCommand,
  MaterializeClaimedOccurrenceCommand,
  OutboxRepository,
  ProcessSiteImportCommand,
  ScheduleExecutionRepository,
  stableJobId,
  assertNeutralDomain,
  getPublicContentUrl,
} from "@next-phish/backend";
import {
  deliverRecipientPayloadSchema,
  feedDeliveriesPayloadSchema,
  materializeOccurrencePayloadSchema,
} from "@next-phish/shared";
import { connection } from "./connection";

const queueOptions = { connection };
const queues = {
  jobs: new Queue("jobs", queueOptions),
  imports: new Queue("imports", queueOptions),
  schedule: new Queue("schedule-execution", queueOptions),
  materialization: new Queue("materialization", queueOptions),
  feeder: new Queue("delivery-feeder", queueOptions),
  delivery: new Queue("delivery", queueOptions),
  events: new Queue("delivery-events", queueOptions),
  outbox: new Queue("outbox", queueOptions),
};

const commonJobOptions = {
  attempts: 5,
  backoff: { type: "exponential" as const, delay: 5_000 },
  removeOnComplete: { count: 5_000, age: 86_400 },
  removeOnFail: { count: 10_000, age: 7 * 86_400 },
};

function strictHandler(
  handlers: Record<string, (job: Job) => Promise<unknown>>,
): (job: Job) => Promise<unknown> {
  return async (job) => {
    const handler = handlers[job.name];
    if (!handler) throw new Error(`Unknown job type: ${job.name}`);
    return handler(job);
  };
}

const workers: Worker[] = [
  new Worker(
    "jobs",
    strictHandler({
      site_import: (job) =>
        Container.get(ProcessSiteImportCommand).execute({
          jobId: String(job.data.jobId),
        }),
    }),
    { connection, concurrency: 5 },
  ),
  new Worker(
    "imports",
    strictHandler({
      target_group_import: (job) =>
        Container.get(ImportTargetGroupUsersCommand).execute({
          jobId: String(job.data.jobId),
        }),
    }),
    { connection, concurrency: 3 },
  ),
  new Worker(
    "schedule-execution",
    strictHandler({
      poll: async () => {
        const occurrences = await Container.get(
          ScheduleExecutionRepository,
        ).claimDueSchedules(Number(process.env.SCHEDULE_CLAIM_BATCH ?? 50));
        await Container.get(DeliveryRepository).recoverExpiredLeases();
        return occurrences;
      },
    }),
    { connection, concurrency: 1 },
  ),
  new Worker(
    "materialization",
    strictHandler({
      "materialize-occurrence": (job) => {
        const payload = materializeOccurrencePayloadSchema.parse(job.data);
        return Container.get(MaterializeClaimedOccurrenceCommand).execute(
          payload,
        );
      },
    }),
    {
      connection,
      concurrency: Number(process.env.MATERIALIZATION_CONCURRENCY ?? 2),
    },
  ),
  new Worker(
    "delivery-feeder",
    strictHandler({
      "feed-deliveries": async (job) => {
        feedDeliveriesPayloadSchema.parse(job.data);
        const horizonMinutes = Number(
          process.env.DELIVERY_HORIZON_MINUTES ?? 5,
        );
        return Container.get(DeliveryRepository).feedNearTerm(
          new Date(Date.now() + horizonMinutes * 60_000),
          Number(process.env.DELIVERY_FEED_BATCH ?? 500),
        );
      },
    }),
    { connection, concurrency: 1 },
  ),
  new Worker(
    "delivery",
    strictHandler({
      "deliver-recipient": (job) => {
        const payload = deliverRecipientPayloadSchema.parse(job.data);
        return Container.get(DeliveryProcessorService).process(
          payload.campaignRecipientId,
        );
      },
    }),
    {
      connection,
      concurrency: Number(process.env.DELIVERY_CONCURRENCY ?? 10),
      limiter: {
        max: Number(process.env.DELIVERY_RATE_MAX ?? 60),
        duration: Number(process.env.DELIVERY_RATE_DURATION_MS ?? 60_000),
      },
    },
  ),
  new Worker(
    "delivery-events",
    strictHandler({
      "process-delivery-event": async () => {
        throw new Error("Delivery event integration is not configured");
      },
    }),
    { connection, concurrency: 5 },
  ),
  new Worker(
    "outbox",
    strictHandler({
      maintenance: () =>
        Container.get(DeliveryRepository).cleanupExecutionHistory(),
      publish: async () => {
        const workerId = `outbox:${process.pid}`;
        const repository = Container.get(OutboxRepository);
        const rows = await repository.claimBatch(workerId, 100);
        for (const row of rows) {
          try {
            const target =
              row.topic === "materialization"
                ? queues.materialization
                : row.topic === "delivery-feeder"
                  ? queues.feeder
                  : row.topic === "delivery"
                    ? queues.delivery
                    : row.topic === "delivery-events"
                      ? queues.events
                      : null;
            if (!target) throw new Error(`Unknown outbox topic: ${row.topic}`);
            const name =
              row.topic === "materialization"
                ? "materialize-occurrence"
                : row.topic === "delivery-feeder"
                  ? "feed-deliveries"
                  : row.topic === "delivery"
                    ? "deliver-recipient"
                    : "process-delivery-event";
            await target.add(name, row.payload, {
              ...commonJobOptions,
              jobId: stableJobId(row.deduplicationKey),
            });
            await repository.acknowledge(row.id, workerId);
          } catch (error) {
            await repository.fail(
              row.id,
              workerId,
              error instanceof Error ? error.message : "Outbox publish failed",
            );
          }
        }
      },
    }),
    { connection, concurrency: 1 },
  ),
];

async function bootstrap() {
  assertNeutralDomain(process.env.MESSAGE_ID_DOMAIN ?? "mail.example.com");
  getPublicContentUrl();
  await queues.schedule.upsertJobScheduler(
    "schedule-poller",
    { every: Number(process.env.SCHEDULE_POLL_INTERVAL_MS ?? 10_000) },
    { name: "poll", data: { version: 1 }, opts: commonJobOptions },
  );
  await queues.outbox.upsertJobScheduler(
    "outbox-publisher",
    { every: Number(process.env.OUTBOX_POLL_INTERVAL_MS ?? 5_000) },
    { name: "publish", data: { version: 1 }, opts: commonJobOptions },
  );
  await queues.outbox.upsertJobScheduler(
    "execution-maintenance",
    {
      every: Number(
        process.env.EXECUTION_MAINTENANCE_INTERVAL_MS ?? 86_400_000,
      ),
    },
    { name: "maintenance", data: { version: 1 }, opts: commonJobOptions },
  );
  await queues.feeder.upsertJobScheduler(
    "delivery-feeder",
    { every: Number(process.env.DELIVERY_FEED_INTERVAL_MS ?? 10_000) },
    {
      name: "feed-deliveries",
      data: { version: 1, wakeId: "periodic" },
      opts: commonJobOptions,
    },
  );
  console.log("Execution workers started");
}

for (const worker of workers) {
  worker.on("error", (error) =>
    console.error(`[${worker.name}] worker error`, error),
  );
}

let shuttingDown = false;
async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Received ${signal}; closing workers`);
  await Promise.all(workers.map((worker) => worker.close()));
  await Promise.all(Object.values(queues).map((queue) => queue.close()));
  await connection.quit();
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

void bootstrap().catch((error) => {
  console.error("Worker bootstrap failed", error);
  process.exitCode = 1;
});
