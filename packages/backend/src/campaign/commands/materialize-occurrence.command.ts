import { CampaignRepository } from "../repositories";

export class MaterializeOccurrenceCommand {
  constructor(private readonly repository: CampaignRepository) {}

  execute(data: {
    scheduleId: string;
    sourceCampaignId: string;
    occurrenceAt: Date;
    organizationId: string;
    createdById: string;
  }) {
    return this.repository.materializeOccurrence(
      data.scheduleId,
      data.sourceCampaignId,
      data.occurrenceAt,
      data.organizationId,
      data.createdById,
    );
  }
}
