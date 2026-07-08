import { describe, it, expect, beforeEach } from "vitest";
import { CacheService } from "../../../src/cache/cache.service";
import type { CacheBackend } from "../../../src/cache/cache-backend.interface";

class MapCacheBackend implements CacheBackend {
  private store = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async set(key: string, value: string, ttl: number): Promise<void> {
    this.store.set(key, value);
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }
}

describe("MailProfileCacheService", () => {
  describe("CacheService (generic)", () => {
    let cache: CacheService;

    beforeEach(() => {
      cache = new CacheService(new MapCacheBackend());
    });

    it("caches values via withCallback", async () => {
      let callCount = 0;

      const value1 = await cache.withCallback(
        "key1",
        async () => {
          callCount++;
          return "loaded";
        },
        300,
      );

      expect(value1).toBe("loaded");
      expect(callCount).toBe(1);

      const value2 = await cache.withCallback(
        "key1",
        async () => {
          callCount++;
          return "should-not-load";
        },
        300,
      );

      expect(value2).toBe("loaded");
      expect(callCount).toBe(1);
    });

    it("caches objects via JSON serialization", async () => {
      const obj = { host: "smtp.example.com", port: 587 };

      await cache.withCallback("key", async () => obj, 300);
      const cached = await cache.get("key");

      expect(JSON.parse(cached!)).toEqual(obj);
    });

    it("set and get work correctly", async () => {
      await cache.set("key", "value", 300);
      const value = await cache.get("key");
      expect(value).toBe("value");
    });

    it("del removes cached value", async () => {
      await cache.set("key", "value", 300);
      await cache.del("key");
      const value = await cache.get("key");
      expect(value).toBeNull();
    });

    it("cache miss calls loader again after delete", async () => {
      let callCount = 0;

      await cache.withCallback(
        "key",
        async () => {
          callCount++;
          return "first";
        },
        300,
      );
      expect(callCount).toBe(1);

      await cache.del("key");

      await cache.withCallback(
        "key",
        async () => {
          callCount++;
          return "second";
        },
        300,
      );
      expect(callCount).toBe(2);
    });
  });
});
