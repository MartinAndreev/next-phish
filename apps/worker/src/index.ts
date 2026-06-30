import "./container";
import type { Job } from "bullmq";
import { Worker } from "bullmq";
import {
  Container,
  ProcessSiteImportCommand,
  ImportTargetGroupUsersCommand,
} from "@next-phish/backend";
import { connection } from "./connection";

console.log("Worker starting...");

const jobHandlers: Record<string, (job: Job) => Promise<void>> = {
  site_import: async (job) => {
    const handler = Container.get(ProcessSiteImportCommand);
    await handler.execute({ jobId: job.data.jobId });
  },
};

const importHandlers: Record<string, (job: Job) => Promise<void>> = {
  target_group_import: async (job) => {
    const handler = Container.get(ImportTargetGroupUsersCommand);
    await handler.execute({ jobId: job.data.jobId });
  },
};

const jobWorker = new Worker(
  "jobs",
  async (job) => {
    console.log(`[jobs] Processing job ${job.id} (${job.name})`);

    const handler = jobHandlers[job.name];
    if (!handler) {
      console.warn(`[jobs] No handler for job type: ${job.name}`);
      return;
    }

    await handler(job);
  },
  { connection, concurrency: 5 },
);

const importWorker = new Worker(
  "imports",
  async (job) => {
    console.log(`[imports] Processing job ${job.id} (${job.name})`);

    const handler = importHandlers[job.name];
    if (!handler) {
      console.warn(`[imports] No handler for job type: ${job.name}`);
      return;
    }

    await handler(job);
  },
  { connection, concurrency: 3 },
);

jobWorker.on("ready", () =>
  console.log("[jobs] BullMQ worker connected to Redis"),
);
jobWorker.on("error", (err) =>
  console.error("[jobs] BullMQ worker error:", err),
);

importWorker.on("ready", () =>
  console.log("[imports] BullMQ worker connected to Redis"),
);
importWorker.on("error", (err) =>
  console.error("[imports] BullMQ worker error:", err),
);

process.on("SIGTERM", async () => {
  console.log("Shutting down workers...");
  await Promise.all([jobWorker.close(), importWorker.close()]);
  process.exit(0);
});
