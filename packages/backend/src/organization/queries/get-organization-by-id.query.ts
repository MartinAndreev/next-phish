import { OrganizationRepository } from "../repositories";
import { OrganizationService } from "../services";
import type { OrganizationView } from "../types";
import type { IQueryHandler } from "../../message-bus";

interface GetOrganizationByIdInput {
  id: string;
  userId: string;
}

export class GetOrganizationByIdQuery implements IQueryHandler<
  GetOrganizationByIdInput,
  OrganizationView | null
> {
  constructor(
    private readonly orgRepo: OrganizationRepository,
    private readonly orgService: OrganizationService,
  ) {}

  async execute(
    input: GetOrganizationByIdInput,
  ): Promise<OrganizationView | null> {
    const org = await this.orgRepo.findById(input.id);
    if (!org) return null;

    const isMember = org.members.some((m) => m.userId === input.userId);
    if (!isMember) return null;

    return this.orgService.toView(org, input.userId);
  }
}
