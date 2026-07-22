import { CampaignRepository } from "../repositories";

export class GetScheduleQuery {
  constructor(private readonly repository: CampaignRepository) {}

  execute(data: { id: string; organizationId: string }) {
    return this.repository.getSchedule(data.id, data.organizationId);
  }
}
