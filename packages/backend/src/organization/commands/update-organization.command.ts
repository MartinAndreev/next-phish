import type { ICommandHandler } from "../../message-bus";
import { OrganizationRepository } from "../repositories";
import { OrganizationService } from "../services";
import type { OrganizationView } from "../types";

interface UpdateOrganizationInput {
  organizationId: string;
  userId: string;
  name: string;
  slug: string;
}

export class UpdateOrganizationCommand implements ICommandHandler<
  UpdateOrganizationInput,
  OrganizationView
> {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly organizationService: OrganizationService,
  ) {}

  async execute(input: UpdateOrganizationInput): Promise<OrganizationView> {
    const organization = await this.organizationRepository.update(
      input.organizationId,
      { name: input.name, slug: input.slug },
    );

    return this.organizationService.toView(organization, input.userId);
  }
}
