import { JobRepository } from "../repositories";
import type { CreateJobData, JobView } from "../types";
import type { ICommandHandler } from "../../message-bus";

export class CreateJobCommand implements ICommandHandler<
  CreateJobData,
  JobView
> {
  constructor(private readonly jobRepo: JobRepository) {}

  async execute(data: CreateJobData): Promise<JobView> {
    return this.jobRepo.create(data) as Promise<JobView>;
  }
}
