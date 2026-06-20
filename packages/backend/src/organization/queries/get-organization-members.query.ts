import { OrganizationRepository } from "../repositories";
import type { MemberView } from "../types";
import type { GetOrganizationMembersInput } from "../validations";
import type { IQueryHandler } from "../../message-bus";

interface GetOrganizationMembersInputWithUserId extends GetOrganizationMembersInput {
  userId: string;
}

interface GetOrganizationMembersResult {
  members: MemberView[];
  total: number;
}

export class GetOrganizationMembersQuery implements IQueryHandler<
  GetOrganizationMembersInputWithUserId,
  GetOrganizationMembersResult
> {
  constructor(private readonly orgRepo: OrganizationRepository) {}

  async execute(
    input: GetOrganizationMembersInputWithUserId,
  ): Promise<GetOrganizationMembersResult> {
    const { rows, total } = await this.orgRepo.findMembersByOrganizationId(
      input.organizationId,
      {
        search: input.search,
        limit: input.limit,
        offset: input.offset,
        sort: input.sort,
        filters: input.filters,
      },
    );

    return { members: rows, total };
  }
}
