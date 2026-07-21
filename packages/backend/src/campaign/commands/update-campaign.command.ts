import { CampaignRepository } from "../repositories";
import type { CampaignDefinitionInput } from "../validations";

export class UpdateCampaignCommand {
  constructor(private readonly repository: CampaignRepository) {}

  execute(data: {
    id: string;
    organizationId: string;
    data: CampaignDefinitionInput;
  }) {
    return this.repository.updateCampaign(
      data.id,
      data.organizationId,
      data.data,
    );
  }
}
