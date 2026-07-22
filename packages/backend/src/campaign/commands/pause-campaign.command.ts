import { CampaignRepository } from "../repositories";

export class PauseCampaignCommand {
  constructor(private readonly repository: CampaignRepository) {}

  execute(data: { id: string; organizationId: string }) {
    return this.repository.pauseCampaign(data.id, data.organizationId);
  }
}
