import { OrganizationRepository } from "../repositories";
import { OrganizationService } from "../services";
import type { OrganizationView } from "../types";
import type { GetUserOrganizationsInput } from "../validations";
import type { IQueryHandler } from "../../message-bus";

interface GetUserOrganizationsResult {
  organizations: OrganizationView[];
  total: number;
}

export class GetUserOrganizationsQuery implements IQueryHandler<
  GetUserOrganizationsInput & { userId: string },
  GetUserOrganizationsResult
> {
  constructor(
    private readonly orgRepo: OrganizationRepository,
    private readonly orgService: OrganizationService,
  ) {}

  async execute(
    input: GetUserOrganizationsInput & { userId: string },
  ): Promise<GetUserOrganizationsResult> {
    const { rows, total } = await this.orgRepo.findByUserId(input.userId, {
      search: input.search,
      limit: input.limit,
      offset: input.offset,
    });

    return {
      organizations: this.orgService.toViewList(rows, input.userId),
      total,
    };
  }
}
