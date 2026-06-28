import type { JobStatus } from "@prisma/client";

export type { JobStatus };

export interface JobView {
  id: string;
  type: string;
  status: JobStatus;
  input: unknown;
  output: unknown | null;
  progress: unknown | null;
  organizationId: string;
  createdById: string;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateJobData {
  type: string;
  input: unknown;
  organizationId: string;
  createdById: string;
}

export interface UpdateJobData {
  status?: JobStatus;
  output?: unknown;
  progress?: unknown;
  startedAt?: Date;
  completedAt?: Date;
}
