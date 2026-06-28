import { faker } from "@faker-js/faker";
import {
  Prisma,
  type PrismaClient,
  type Job,
  type JobStatus,
} from "@prisma/client";
import { Factory } from "./factory";

interface JobCreateData {
  type: string;
  status?: JobStatus;
  input: Record<string, unknown>;
  organizationId: string;
  createdById: string;
}

export class JobFactory extends Factory<JobCreateData, Job> {
  constructor(prisma: PrismaClient) {
    super((data) =>
      prisma.job.create({
        data: {
          type: data.type,
          status: data.status ?? "PENDING",
          input: data.input as Prisma.InputJsonValue,
          organizationId: data.organizationId,
          createdById: data.createdById,
        },
      }),
    );
  }

  getShape(): JobCreateData {
    return {
      type: "site_import",
      input: { url: faker.internet.url() },
      organizationId: "",
      createdById: "",
    };
  }
}
