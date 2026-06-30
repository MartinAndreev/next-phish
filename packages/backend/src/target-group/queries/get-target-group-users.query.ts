import { TargetGroupRepository } from "../repositories";
import { TargetGroupService } from "../services";
import type { TargetGroupUserView } from "../types";
import type { IQueryHandler } from "../../message-bus";

interface GetTargetGroupUsersInput {
  targetGroupId: string;
  search?: string;
  limit: number;
  offset: number;
}

interface GetTargetGroupUsersResult {
  users: TargetGroupUserView[];
  total: number;
}

export class GetTargetGroupUsersQuery implements IQueryHandler<
  GetTargetGroupUsersInput,
  GetTargetGroupUsersResult
> {
  constructor(
    private readonly targetGroupRepo: TargetGroupRepository,
    private readonly targetGroupService: TargetGroupService,
  ) {}

  async execute(
    input: GetTargetGroupUsersInput,
  ): Promise<GetTargetGroupUsersResult> {
    const { rows, total } = await this.targetGroupRepo.findUsersByGroupId(
      input.targetGroupId,
      {
        search: input.search,
        limit: input.limit,
        offset: input.offset,
      },
    );

    return {
      users: this.targetGroupService.toUserViews(rows),
      total,
    };
  }
}
