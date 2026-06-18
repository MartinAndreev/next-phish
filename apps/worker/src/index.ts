import { Worker } from "bullmq";
import { connection } from "./connection";

console.log("Worker starting...");

const worker = new Worker(
  "default",
  async (job) => {
    console.log(`Processing job ${job.id} (${job.name})`);
  },
  { connection },
);

worker.on("ready", () => console.log("BullMQ worker connected to Redis"));
worker.on("error", (err) => console.error("BullMQ worker error:", err));

process.on("SIGTERM", async () => {
  console.log("Shutting down worker...");
  await worker.close();
  process.exit(0);
});
