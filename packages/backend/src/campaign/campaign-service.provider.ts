import { Container } from "typedi";
import type { PrismaClient } from "@prisma/client";
import { CampaignRepository } from "./repositories";
import { CampaignService } from "./services";
import {
  ListCampaignsQuery,
  GetCampaignQuery,
  ListSchedulesQuery,
  GetScheduleQuery,
  GetScheduleTimelineQuery,
} from "./queries";
import {
  CreateCampaignCommand,
  UpdateCampaignCommand,
  PublishCampaignCommand,
  CloneCampaignCommand,
  CreateScheduleCommand,
  UpdateScheduleCommand,
  CancelScheduleCommand,
  PauseCampaignCommand,
  ResumeCampaignCommand,
  CompleteCampaignCommand,
  DeleteCampaignCommand,
  DuplicateScheduleCommand,
  MaterializeOccurrenceCommand,
  MaterializeClaimedOccurrenceCommand,
} from "./commands";

export function registerCampaignServices(db: PrismaClient): void {
  const service = new CampaignService();
  const repo = new CampaignRepository(db, service);
  Container.set(CampaignService, service);
  Container.set(CampaignRepository, repo);
  for (const [token, instance] of [
    [ListCampaignsQuery, new ListCampaignsQuery(repo)],
    [GetCampaignQuery, new GetCampaignQuery(repo)],
    [CreateCampaignCommand, new CreateCampaignCommand(repo)],
    [UpdateCampaignCommand, new UpdateCampaignCommand(repo)],
    [PublishCampaignCommand, new PublishCampaignCommand(repo)],
    [CloneCampaignCommand, new CloneCampaignCommand(repo)],
    [ListSchedulesQuery, new ListSchedulesQuery(repo)],
    [GetScheduleQuery, new GetScheduleQuery(repo)],
    [GetScheduleTimelineQuery, new GetScheduleTimelineQuery(repo)],
    [CreateScheduleCommand, new CreateScheduleCommand(repo)],
    [UpdateScheduleCommand, new UpdateScheduleCommand(repo)],
    [CancelScheduleCommand, new CancelScheduleCommand(repo)],
    [PauseCampaignCommand, new PauseCampaignCommand(repo)],
    [ResumeCampaignCommand, new ResumeCampaignCommand(repo)],
    [CompleteCampaignCommand, new CompleteCampaignCommand(repo)],
    [DeleteCampaignCommand, new DeleteCampaignCommand(repo)],
    [DuplicateScheduleCommand, new DuplicateScheduleCommand(repo)],
    [MaterializeOccurrenceCommand, new MaterializeOccurrenceCommand(repo)],
    [
      MaterializeClaimedOccurrenceCommand,
      new MaterializeClaimedOccurrenceCommand(repo),
    ],
  ] as const)
    Container.set(token, instance);
}
