import { CampaignRepository } from "../repositories";

export class GetCampaignQuery {
  constructor(private readonly repository: CampaignRepository) {}

  execute(data: { id: string; organizationId: string }) {
    return this.repository.getCampaign(data.id, data.organizationId);
  }
}
