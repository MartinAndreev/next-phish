import { Container } from "typedi";
import type { PrismaClient } from "@prisma/client";
import { JobRepository } from "./repositories";
import { JobService } from "./services";
import { CreateJobCommand, UpdateJobCommand } from "./commands";
import { GetJobByIdQuery } from "./queries";

export function registerJobServices(db: PrismaClient): void {
  const jobRepo = new JobRepository(db);
  const jobService = new JobService();

  Container.set(JobRepository, jobRepo);
  Container.set(JobService, jobService);
  Container.set(CreateJobCommand, new CreateJobCommand(jobRepo));
  Container.set(UpdateJobCommand, new UpdateJobCommand(jobRepo));
  Container.set(GetJobByIdQuery, new GetJobByIdQuery(jobRepo, jobService));
}
