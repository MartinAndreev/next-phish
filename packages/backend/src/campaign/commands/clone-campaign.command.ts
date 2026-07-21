import { CampaignRepository } from "../repositories";
import type { CampaignType } from "../types";

export class CloneCampaignCommand {
  constructor(private readonly repository: CampaignRepository) {}

  execute(data: {
    id: string;
    organizationId: string;
    createdById: string;
    name: string;
    type: CampaignType;
    targetGroupId: string | null;
  }) {
    const { id, organizationId, createdById, ...input } = data;
    return this.repository.cloneCampaign(
      id,
      organizationId,
      createdById,
      input,
    );
  }
}
