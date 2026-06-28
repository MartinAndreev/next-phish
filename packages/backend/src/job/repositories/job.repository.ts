import { Prisma, type PrismaClient } from "@prisma/client";
import type { CreateJobData, UpdateJobData } from "../types";

export class JobRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string) {
    return this.db.job.findUnique({
      where: { id },
    });
  }

  async create(data: CreateJobData) {
    return this.db.job.create({
      data: {
        type: data.type,
        input: data.input as Prisma.InputJsonValue,
        organizationId: data.organizationId,
        createdById: data.createdById,
      },
    });
  }

  async update(id: string, data: UpdateJobData) {
    return this.db.job.update({
      where: { id },
      data: {
        status: data.status,
        output: data.output
          ? (data.output as Prisma.InputJsonValue)
          : undefined,
        progress: data.progress
          ? (data.progress as Prisma.InputJsonValue)
          : undefined,
        startedAt: data.startedAt,
        completedAt: data.completedAt,
      },
    });
  }
}
