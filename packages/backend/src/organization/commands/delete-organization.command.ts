import type { ICommandHandler } from "../../message-bus";

interface DeleteOrganizationInput {
  organizationId: string;
  headers: Headers;
}

interface AuthApi {
  deleteOrganization: (opts: {
    body: { organizationId: string };
    headers: Headers;
  }) => Promise<unknown>;
}

export class DeleteOrganizationCommand implements ICommandHandler<
  DeleteOrganizationInput,
  void
> {
  constructor(private readonly auth: { api: AuthApi }) {}

  async execute(input: DeleteOrganizationInput): Promise<void> {
    await this.auth.api.deleteOrganization({
      body: { organizationId: input.organizationId },
      headers: input.headers,
    });
  }
}
