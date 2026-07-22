import { CampaignRepository } from "../repositories";

export class DeleteCampaignCommand {
  constructor(private readonly repository: CampaignRepository) {}

  execute(data: { id: string; organizationId: string }) {
    return this.repository.deleteCampaign(data.id, data.organizationId);
  }
}
