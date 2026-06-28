import "./container";
import { Worker } from "bullmq";
import { Container, ProcessSiteImportCommand } from "@next-phish/backend";
import { connection } from "./connection";

console.log("Worker starting...");

const worker = new Worker(
  "jobs",
  async (job) => {
    console.log(`Processing job ${job.id} (${job.name})`);

    if (job.name === "site_import") {
      const handler = Container.get(ProcessSiteImportCommand);
      await handler.execute({ jobId: job.data.jobId });
    }
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
