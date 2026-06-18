import { Redis } from "ioredis";

const host = process.env.REDIS_HOST || "localhost";
const port = Number(process.env.REDIS_PORT) || 6379;

export const connection = new Redis({ host, port, maxRetriesPerRequest: null });
