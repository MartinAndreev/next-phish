import { Container } from "typedi";
import type { PrismaClient } from "@prisma/client";
import { TargetGroupRepository } from "./repositories";
import { TargetGroupService } from "./services";
import {
  GetTargetGroupsQuery,
  GetTargetGroupByIdQuery,
  GetTargetGroupUsersQuery,
} from "./queries";
import {
  CreateTargetGroupCommand,
  UpdateTargetGroupCommand,
  DeleteTargetGroupCommand,
  ImportTargetGroupUsersCommand,
} from "./commands";
import { JobRepository } from "../job";

export function registerTargetGroupServices(db: PrismaClient): void {
  const targetGroupRepo = new TargetGroupRepository(db);
  const targetGroupService = new TargetGroupService();
  const jobRepo = Container.get(JobRepository);

  Container.set(TargetGroupRepository, targetGroupRepo);
  Container.set(TargetGroupService, targetGroupService);
  Container.set(
    GetTargetGroupsQuery,
    new GetTargetGroupsQuery(targetGroupRepo, targetGroupService),
  );
  Container.set(
    GetTargetGroupByIdQuery,
    new GetTargetGroupByIdQuery(targetGroupRepo, targetGroupService),
  );
  Container.set(
    GetTargetGroupUsersQuery,
    new GetTargetGroupUsersQuery(targetGroupRepo, targetGroupService),
  );
  Container.set(
    CreateTargetGroupCommand,
    new CreateTargetGroupCommand(targetGroupRepo, targetGroupService),
  );
  Container.set(
    UpdateTargetGroupCommand,
    new UpdateTargetGroupCommand(targetGroupRepo),
  );
  Container.set(
    DeleteTargetGroupCommand,
    new DeleteTargetGroupCommand(targetGroupRepo),
  );
  Container.set(
    ImportTargetGroupUsersCommand,
    new ImportTargetGroupUsersCommand(jobRepo, targetGroupRepo),
  );
}
