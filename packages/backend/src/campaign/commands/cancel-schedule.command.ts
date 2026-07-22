import { CampaignRepository } from "../repositories";

export class CancelScheduleCommand {
  constructor(private readonly repository: CampaignRepository) {}

  execute(data: { id: string; organizationId: string }) {
    return this.repository.cancelSchedule(data.id, data.organizationId);
  }
}
