import { JobRepository } from "../repositories";
import { JobService } from "../services";
import type { JobView } from "../types";
import type { IQueryHandler } from "../../message-bus";

interface GetJobByIdInput {
  id: string;
}

export class GetJobByIdQuery implements IQueryHandler<
  GetJobByIdInput,
  JobView | null
> {
  constructor(
    private readonly jobRepo: JobRepository,
    private readonly jobService: JobService,
  ) {}

  async execute({ id }: GetJobByIdInput): Promise<JobView | null> {
    const row = await this.jobRepo.findById(id);
    if (!row) return null;
    return this.jobService.toView(row as JobView);
  }
}
