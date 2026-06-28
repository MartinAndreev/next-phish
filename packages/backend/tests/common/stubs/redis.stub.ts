import { vi } from "vitest";

export function createRedisStub() {
  const store = new Map<string, string>();
  const channels = new Map<string, Set<(message: string) => void>>();

  return {
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    set: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    del: vi.fn(async (key: string) => {
      store.delete(key);
    }),
    publish: vi.fn(async (channel: string, message: string) => {
      const subscribers = channels.get(channel);
      if (subscribers) {
        for (const cb of subscribers) {
          cb(message);
        }
      }
    }),
    subscribe: vi.fn(
      async (channel: string, callback: (message: string) => void) => {
        if (!channels.has(channel)) {
          channels.set(channel, new Set());
        }
        channels.get(channel)!.add(callback);
      },
    ),
    unsubscribe: vi.fn(async (channel: string) => {
      channels.delete(channel);
    }),
    disconnect: vi.fn(async () => {}),
    quit: vi.fn(async () => {}),
    _store: store,
    _channels: channels,
  };
}

export type RedisStub = ReturnType<typeof createRedisStub>;
