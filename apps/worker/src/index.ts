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
  target_group_import: async (job) => {
    const handler = Container.get(ImportTargetGroupUsersCommand);
    await handler.execute({ jobId: job.data.jobId });
  },
};

const worker = new Worker(
  "jobs",
  async (job) => {
    console.log(`Processing job ${job.id} (${job.name})`);

    const handler = jobHandlers[job.name];
    if (!handler) {
      console.warn(`No handler for job type: ${job.name}`);
      return;
    }

    await handler(job);
  },
  { connection, concurrency: 5 },
);

worker.on("ready", () => console.log("BullMQ worker connected to Redis"));
worker.on("error", (err) => console.error("BullMQ worker error:", err));

process.on("SIGTERM", async () => {
  console.log("Shutting down worker...");
  await worker.close();
  process.exit(0);
});
