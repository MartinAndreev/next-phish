import { TargetGroupRepository } from "../repositories";
import type { ICommandHandler } from "../../message-bus";

interface DeleteTargetGroupInput {
  id: string;
  organizationId: string;
}

export class DeleteTargetGroupCommand implements ICommandHandler<
  DeleteTargetGroupInput,
  boolean
> {
  constructor(private readonly targetGroupRepo: TargetGroupRepository) {}

  async execute({
    id,
    organizationId,
  }: DeleteTargetGroupInput): Promise<boolean> {
    return this.targetGroupRepo.delete(id, organizationId);
  }
}
