import type { ICommandHandler } from "../../message-bus";
import type { CreateOrganizationData, OrganizationView } from "../types";

interface CreateOrganizationInput extends CreateOrganizationData {
  userId: string;
  headers: Headers;
}

interface AuthApi {
  createOrganization: (opts: {
    body: CreateOrganizationData;
    headers: Headers;
  }) => Promise<unknown>;
}

export class CreateOrganizationCommand implements ICommandHandler<
  CreateOrganizationInput,
  OrganizationView
> {
  constructor(private readonly auth: { api: AuthApi }) {}

  async execute(input: CreateOrganizationInput): Promise<OrganizationView> {
    const org = await this.auth.api.createOrganization({
      body: {
        name: input.name,
        slug: input.slug,
      },
      headers: input.headers,
    });

    return org as OrganizationView;
  }
}
