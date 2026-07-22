import { CampaignRepository } from "../repositories";

export class DeleteScheduleCommand {
  constructor(private readonly repository: CampaignRepository) {}

  execute(data: { id: string; organizationId: string }) {
    return this.repository.deleteSchedule(data.id, data.organizationId);
  }
}
