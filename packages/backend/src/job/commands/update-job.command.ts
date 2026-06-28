import { JobRepository } from "../repositories";
import type { UpdateJobData, JobView } from "../types";
import type { ICommandHandler } from "../../message-bus";

interface UpdateJobInput {
  id: string;
  data: UpdateJobData;
}

export class UpdateJobCommand implements ICommandHandler<
  UpdateJobInput,
  JobView
> {
  constructor(private readonly jobRepo: JobRepository) {}

  async execute({ id, data }: UpdateJobInput): Promise<JobView> {
    return this.jobRepo.update(id, data) as Promise<JobView>;
  }
}
