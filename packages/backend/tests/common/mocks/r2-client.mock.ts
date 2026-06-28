import { vi } from "vitest";

export function createR2ClientMock() {
  const objects = new Map<string, { body: Buffer; contentType: string }>();

  return {
    uploadObject: vi.fn(
      async (key: string, body: Buffer | Uint8Array, contentType: string) => {
        objects.set(key, { body: Buffer.from(body), contentType });
      },
    ),
    getObject: vi.fn(async (key: string) => {
      return objects.get(key) ?? null;
    }),
    deleteObject: vi.fn(async (key: string) => {
      objects.delete(key);
    }),
    getPublicUrl: vi.fn(async (key: string) => {
      return `https://test-bucket.r2.dev/${key}`;
    }),
    _objects: objects,
  };
}

export type R2ClientMock = ReturnType<typeof createR2ClientMock>;
