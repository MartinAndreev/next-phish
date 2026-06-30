import { TargetGroupRepository } from "../repositories";
import type { UpdateTargetGroupData } from "../types";
import type { ICommandHandler } from "../../message-bus";

interface UpdateTargetGroupInput {
  id: string;
  organizationId: string;
  data: UpdateTargetGroupData;
}

export class UpdateTargetGroupCommand implements ICommandHandler<
  UpdateTargetGroupInput,
  boolean
> {
  constructor(private readonly targetGroupRepo: TargetGroupRepository) {}

  async execute({
    id,
    organizationId,
    data,
  }: UpdateTargetGroupInput): Promise<boolean> {
    return this.targetGroupRepo.update(id, organizationId, data);
  }
}
