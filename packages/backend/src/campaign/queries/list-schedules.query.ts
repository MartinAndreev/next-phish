import { CampaignRepository } from "../repositories";

export class ListSchedulesQuery {
  constructor(private readonly repository: CampaignRepository) {}

  execute(data: {
    organizationId: string;
    search?: string;
    sort?: Array<{
      field: "name" | "type" | "status" | "startsAt";
      order: "asc" | "desc";
    }>;
    filters?: {
      type?: "ONE_TIME" | "RECURRING";
      status?: "DRAFT" | "SCHEDULED" | "RUNNING" | "COMPLETED" | "CANCELLED";
    };
    limit: number;
    offset: number;
  }) {
    const { organizationId, ...input } = data;
    return this.repository.listSchedules(organizationId, input);
  }
}
