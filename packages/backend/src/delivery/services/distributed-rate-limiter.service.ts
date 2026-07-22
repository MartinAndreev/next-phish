import type { Redis } from "ioredis";

const FIXED_WINDOW_SCRIPT = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[2])
end
local ttl = redis.call('PTTL', KEYS[1])
if current > tonumber(ARGV[1]) then
  return {0, ttl}
end
return {1, ttl}
`;

export class DistributedRateLimiterService {
  constructor(private readonly redis: Redis) {}

  async consume(input: {
    key: string;
    max: number;
    durationMs: number;
  }): Promise<{ allowed: boolean; retryAfterMs: number }> {
    const [allowed, ttl] = (await this.redis.eval(
      FIXED_WINDOW_SCRIPT,
      1,
      `delivery-rate:${input.key}`,
      String(Math.max(1, input.max)),
      String(Math.max(1_000, input.durationMs)),
    )) as [number, number];
    return {
      allowed: allowed === 1,
      retryAfterMs: Math.max(1_000, ttl),
    };
  }

  async isCircuitOpen(
    key: string,
  ): Promise<{ open: boolean; retryAfterMs: number }> {
    const ttl = await this.redis.pttl(`delivery-circuit:open:${key}`);
    return { open: ttl > 0, retryAfterMs: Math.max(0, ttl) };
  }

  async recordThrottle(input: {
    key: string;
    threshold?: number;
    observationMs?: number;
    openMs?: number;
  }): Promise<void> {
    const counterKey = `delivery-circuit:throttle:${input.key}`;
    const count = await this.redis.incr(counterKey);
    if (count === 1)
      await this.redis.pexpire(counterKey, input.observationMs ?? 60_000);
    if (count >= (input.threshold ?? 3)) {
      await this.redis.set(
        `delivery-circuit:open:${input.key}`,
        "1",
        "PX",
        input.openMs ?? 60_000,
      );
    }
  }

  async recordSuccess(key: string): Promise<void> {
    await this.redis.del(`delivery-circuit:throttle:${key}`);
  }

  async consumeAll(
    limits: Array<{ key: string; max: number; durationMs: number }>,
  ): Promise<{ allowed: boolean; retryAfterMs: number }> {
    let retryAfterMs = 0;
    for (const limit of limits) {
      const result = await this.consume(limit);
      if (!result.allowed)
        retryAfterMs = Math.max(retryAfterMs, result.retryAfterMs);
    }
    return { allowed: retryAfterMs === 0, retryAfterMs };
  }
}
