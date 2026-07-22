import type { IQueryHandler } from "../../message-bus";
import { OrganizationRepository } from "../repositories";
import type { OrganizationAnalyticsView } from "../types";

interface GetOrganizationAnalyticsInput {
  organizationId: string;
}

export class GetOrganizationAnalyticsQuery implements IQueryHandler<
  GetOrganizationAnalyticsInput,
  OrganizationAnalyticsView
> {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  async execute(
    input: GetOrganizationAnalyticsInput,
  ): Promise<OrganizationAnalyticsView> {
    return {
      months: await this.organizationRepository.getAnalytics(
        input.organizationId,
      ),
    };
  }
}
