import { CampaignRepository } from "../repositories";
import type { ScheduleDefinitionInput } from "../validations";

export class CreateScheduleCommand {
  constructor(private readonly repository: CampaignRepository) {}

  execute(
    data: ScheduleDefinitionInput & {
      organizationId: string;
      createdById: string;
    },
  ) {
    const { organizationId, createdById, ...input } = data;
    return this.repository.createSchedule(
      organizationId,
      createdById,
      input as ScheduleDefinitionInput,
    );
  }
}
