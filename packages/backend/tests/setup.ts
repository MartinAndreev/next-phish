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
  if (testDb) {
    await testDb.resetData();
  }
});

afterAll(async () => {
  if (testDb) {
    await testDb.cleanup();
  }
});

export function getPrisma() {
  if (!testDb) throw new Error("Test database not initialized");
  return testDb.prisma;
}

export function getFactories() {
  if (!testDb) throw new Error("Test database not initialized");
  return testDb.factories;
}
