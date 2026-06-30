import { TargetGroupRepository } from "../repositories";
import { TargetGroupService } from "../services";
import type { TargetGroupView } from "../types";
import type { IQueryHandler } from "../../message-bus";

interface GetTargetGroupByIdInput {
  id: string;
  organizationId: string;
}

export class GetTargetGroupByIdQuery implements IQueryHandler<
  GetTargetGroupByIdInput,
  TargetGroupView | null
> {
  constructor(
    private readonly targetGroupRepo: TargetGroupRepository,
    private readonly targetGroupService: TargetGroupService,
  ) {}

  async execute({
    id,
    organizationId,
  }: GetTargetGroupByIdInput): Promise<TargetGroupView | null> {
    const row = await this.targetGroupRepo.findById(id, organizationId);
    if (!row) return null;
    return this.targetGroupService.toView(row);
  }
}
