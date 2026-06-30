import { Queue } from "bullmq";
import { redis } from "./redis-connection";

export const jobQueue = new Queue("jobs", { connection: redis });
export const importQueue = new Queue("imports", { connection: redis });
