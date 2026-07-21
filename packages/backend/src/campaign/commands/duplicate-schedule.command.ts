import { CampaignRepository } from "../repositories";

export class DuplicateScheduleCommand {
  constructor(private readonly repository: CampaignRepository) {}

  execute(data: { id: string; organizationId: string; createdById: string }) {
    return this.repository.duplicateSchedule(
      data.id,
      data.organizationId,
      data.createdById,
    );
  }
}
