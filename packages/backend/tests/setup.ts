import {
  createTestDatabase,
  type TestDatabase,
} from "@next-phish/database/src/test-db";
import { afterAll, beforeAll, beforeEach } from "vitest";

let testDb: TestDatabase;

beforeAll(async () => {
  testDb = await createTestDatabase();
}, 60000);

beforeEach(async () => {
  await testDb.resetData();
});

afterAll(async () => {
  await testDb.cleanup();
});

export function getDb() {
  return testDb.db;
}
