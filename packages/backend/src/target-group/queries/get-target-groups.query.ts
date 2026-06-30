import { TargetGroupRepository } from "../repositories";
import { TargetGroupService } from "../services";
import type { TargetGroupListItemView } from "../types";
import type { GetTargetGroupsInput } from "../validations";
import type { IQueryHandler } from "../../message-bus";

interface GetTargetGroupsInputWithOrganizationId extends GetTargetGroupsInput {
  organizationId: string;
}

interface GetTargetGroupsResult {
  targetGroups: TargetGroupListItemView[];
  total: number;
}

export class GetTargetGroupsQuery implements IQueryHandler<
  GetTargetGroupsInputWithOrganizationId,
  GetTargetGroupsResult
> {
  constructor(
    private readonly targetGroupRepo: TargetGroupRepository,
    private readonly targetGroupService: TargetGroupService,
  ) {}

  async execute(
    input: GetTargetGroupsInputWithOrganizationId,
  ): Promise<GetTargetGroupsResult> {
    const { rows, total } = await this.targetGroupRepo.findByOrganizationId(
      input.organizationId,
      {
        search: input.search,
        limit: input.limit,
        offset: input.offset,
        sort: input.sort,
        filters: input.filters,
      },
    );

    return {
      targetGroups: this.targetGroupService.toListItemViews(rows),
      total,
    };
  }
}
