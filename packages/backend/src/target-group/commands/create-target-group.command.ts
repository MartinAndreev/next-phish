import { TargetGroupRepository } from "../repositories";
import { TargetGroupService } from "../services";
import type { CreateTargetGroupData, TargetGroupView } from "../types";
import type { ICommandHandler } from "../../message-bus";

export class CreateTargetGroupCommand implements ICommandHandler<
  CreateTargetGroupData,
  TargetGroupView
> {
  constructor(
    private readonly targetGroupRepo: TargetGroupRepository,
    private readonly targetGroupService: TargetGroupService,
  ) {}

  async execute(data: CreateTargetGroupData): Promise<TargetGroupView> {
    const row = await this.targetGroupRepo.create(data);
    return this.targetGroupService.toView(row);
  }
}
