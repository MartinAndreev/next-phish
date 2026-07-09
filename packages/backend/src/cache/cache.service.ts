import type { CacheBackend } from "./cache-backend.interface";

export class CacheService {
  constructor(private readonly backend: CacheBackend) {}

  async get(key: string): Promise<string | null> {
    return this.backend.get(key);
  }

  async set(key: string, value: string, ttlSeconds = 300): Promise<void> {
    await this.backend.set(key, value, ttlSeconds);
  }

  async del(key: string): Promise<void> {
    await this.backend.del(key);
  }

  async withCallback<T>(
    key: string,
    loader: () => Promise<T>,
    ttlSeconds = 300,
  ): Promise<T> {
    const cached = await this.backend.get(key);
    if (cached !== null) {
      return JSON.parse(cached) as T;
    }
    const value = await loader();
    await this.backend.set(key, JSON.stringify(value), ttlSeconds);
    return value;
  }
}
