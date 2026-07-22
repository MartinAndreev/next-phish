import { CampaignRepository } from "../repositories";
import type { CampaignStatus, CampaignType } from "../types";

export class ListCampaignsQuery {
  constructor(private readonly repository: CampaignRepository) {}

  execute(data: {
    organizationId: string;
    type?: CampaignType;
    status?: CampaignStatus;
    search?: string;
    sort?: Array<{
      field: "name" | "type" | "status" | "createdAt" | "updatedAt";
      order: "asc" | "desc";
    }>;
    filters?: { type?: CampaignType; status?: CampaignStatus };
    limit: number;
    offset: number;
  }) {
    const { organizationId, ...input } = data;
    return this.repository.listCampaigns(organizationId, input);
  }
}
