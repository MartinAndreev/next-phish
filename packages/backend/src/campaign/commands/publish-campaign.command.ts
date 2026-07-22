import { CampaignRepository } from "../repositories";

export class PublishCampaignCommand {
  constructor(private readonly repository: CampaignRepository) {}

  execute(data: { id: string; organizationId: string }) {
    return this.repository.publish(data.id, data.organizationId);
  }
}
