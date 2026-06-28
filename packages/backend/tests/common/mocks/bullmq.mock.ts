import { vi } from "vitest";

interface MockJob {
  id: string;
  name: string;
  data: unknown;
  attemptsMade: number;
  opts: unknown;
}

export function createBullMQMock() {
  const jobs: MockJob[] = [];
  let jobIdCounter = 0;

  const queue = {
    add: vi.fn(async (name: string, data: unknown, opts?: unknown) => {
      const job: MockJob = {
        id: String(++jobIdCounter),
        name,
        data,
        attemptsMade: 0,
        opts: opts ?? {},
      };
      jobs.push(job);
      return job;
    }),
    getJob: vi.fn(async (id: string) => {
      return jobs.find((j) => j.id === id) ?? null;
    }),
    close: vi.fn(async () => {}),
    _jobs: jobs,
  };

  return { queue };
}

export type BullMQMock = ReturnType<typeof createBullMQMock>;
