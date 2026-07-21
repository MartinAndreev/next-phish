import { CampaignRepository } from "../repositories";

export class ListSchedulesQuery {
  constructor(private readonly repository: CampaignRepository) {}

  execute(data: { organizationId: string; limit: number; offset: number }) {
    return this.repository.listSchedules(
      data.organizationId,
      data.limit,
      data.offset,
    );
  }
}
