import { CampaignRepository } from "../repositories";

export class CompleteCampaignCommand {
  constructor(private readonly repository: CampaignRepository) {}

  execute(data: { id: string; organizationId: string }) {
    return this.repository.completeCampaign(data.id, data.organizationId);
  }
}
