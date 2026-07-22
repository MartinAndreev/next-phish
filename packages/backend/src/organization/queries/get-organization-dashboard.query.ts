import type { IQueryHandler } from "../../message-bus";
import { OrganizationRepository } from "../repositories";
import type { OrganizationDashboardView } from "../types";

interface GetOrganizationDashboardInput {
  organizationId: string;
}

export class GetOrganizationDashboardQuery implements IQueryHandler<
  GetOrganizationDashboardInput,
  OrganizationDashboardView
> {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  execute(
    input: GetOrganizationDashboardInput,
  ): Promise<OrganizationDashboardView> {
    return this.organizationRepository.getDashboard(input.organizationId);
  }
}
