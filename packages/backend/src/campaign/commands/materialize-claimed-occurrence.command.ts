import { CampaignRepository } from "../repositories";

export class MaterializeClaimedOccurrenceCommand {
  constructor(private readonly repository: CampaignRepository) {}

  execute(data: { occurrenceId: string }) {
    return this.repository.materializeClaimedOccurrence(data.occurrenceId);
  }
}
