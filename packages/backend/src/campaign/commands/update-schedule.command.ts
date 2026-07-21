import { CampaignRepository } from "../repositories";
import type { ScheduleDefinitionInput } from "../validations";

export class UpdateScheduleCommand {
  constructor(private readonly repository: CampaignRepository) {}

  execute(data: {
    id: string;
    organizationId: string;
    data: ScheduleDefinitionInput;
  }) {
    return this.repository.updateSchedule(
      data.id,
      data.organizationId,
      data.data,
    );
  }
}
