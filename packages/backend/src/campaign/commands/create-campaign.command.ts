import { CampaignRepository } from "../repositories";
import type { CampaignDefinitionInput } from "../validations";

export class CreateCampaignCommand {
  constructor(private readonly repository: CampaignRepository) {}

  execute(
    data: CampaignDefinitionInput & {
      organizationId: string;
      createdById: string;
    },
  ) {
    const { organizationId, createdById, ...input } = data;
    return this.repository.createCampaign(
      organizationId,
      createdById,
      input as CampaignDefinitionInput,
    );
  }
}
