import { initializeContainer } from "@next-phish/backend";
import { connection } from "./connection";

const encryptionKey = process.env.PAGE_SUBMISSION_ENCRYPTION_KEY;
if (!encryptionKey) {
  throw new Error(
    "PAGE_SUBMISSION_ENCRYPTION_KEY environment variable is not set.",
  );
}

initializeContainer({ encryptionKey, redis: connection });
