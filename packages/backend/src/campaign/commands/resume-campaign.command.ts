import { CampaignRepository } from "../repositories";

export class ResumeCampaignCommand {
  constructor(private readonly repository: CampaignRepository) {}

  execute(data: { id: string; organizationId: string }) {
    return this.repository.resumeCampaign(data.id, data.organizationId);
  }
}
