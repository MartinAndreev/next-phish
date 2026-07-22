import { CampaignRepository } from "../repositories";

export class ActivateScheduleCommand {
  constructor(private readonly repository: CampaignRepository) {}

  execute(data: { id: string; organizationId: string }) {
    return this.repository.activateSchedule(data.id, data.organizationId);
  }
}
