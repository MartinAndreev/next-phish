import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CampaignRepository } from "../../../src/campaign/repositories";
import {
  CancelScheduleCommand,
  CloneCampaignCommand,
  CompleteCampaignCommand,
  CreateCampaignCommand,
  CreateScheduleCommand,
  DuplicateScheduleCommand,
  MaterializeOccurrenceCommand,
  PauseCampaignCommand,
  PublishCampaignCommand,
  ResumeCampaignCommand,
  UpdateCampaignCommand,
  UpdateScheduleCommand,
} from "../../../src/campaign/commands";

const campaignDefinition = {
  name: "Security awareness",
  tags: ["quarterly"],
  type: "CONCRETE" as const,
  status: "PUBLISHED" as const,
  emailTemplateId: "email-1",
  pageId: "page-1",
  mailSendingProfileId: "profile-1",
  targetGroupId: "group-1",
  targetTimezone: "UTC",
  autoCompleteAfterDays: 20,
};

const scheduleDefinition = {
  name: "January run",
  type: "ONE_TIME" as const,
  sourceCampaignIds: ["campaign-1"],
  targetGroupId: "group-1",
  targetTimezone: "UTC",
  startsAt: new Date("2030-01-01T12:00:00Z"),
  frequency: null,
  localTimeMinutes: null,
  weekday: null,
  dayOfMonth: null,
  month: null,
  selectionStrategy: null,
  shuffleDeck: false,
  deliveryMode: "BLAST" as const,
  dripEmailsPerMinute: null,
  batchSize: null,
  batchIntervalMinutes: null,
  maxCampaigns: null,
  endsAt: null,
  autoCompleteAfterDays: 20,
};

describe("campaign commands", () => {
  const repository = {
    createCampaign: vi.fn(),
    updateCampaign: vi.fn(),
    publish: vi.fn(),
    cloneCampaign: vi.fn(),
    pauseCampaign: vi.fn(),
    resumeCampaign: vi.fn(),
    completeCampaign: vi.fn(),
    createSchedule: vi.fn(),
    updateSchedule: vi.fn(),
    cancelSchedule: vi.fn(),
    duplicateSchedule: vi.fn(),
    materializeOccurrence: vi.fn(),
  } as unknown as CampaignRepository;

  beforeEach(() => vi.clearAllMocks());

  it("creates a campaign in the active organization", async () => {
    await new CreateCampaignCommand(repository).execute({
      ...campaignDefinition,
      organizationId: "org-1",
      createdById: "user-1",
    });
    expect(repository.createCampaign).toHaveBeenCalledWith(
      "org-1",
      "user-1",
      campaignDefinition,
    );
  });

  it("updates a campaign", async () => {
    await new UpdateCampaignCommand(repository).execute({
      id: "campaign-1",
      organizationId: "org-1",
      data: campaignDefinition,
    });
    expect(repository.updateCampaign).toHaveBeenCalledWith(
      "campaign-1",
      "org-1",
      campaignDefinition,
    );
  });

  it.each([
    [PublishCampaignCommand, "publish"],
    [PauseCampaignCommand, "pauseCampaign"],
    [ResumeCampaignCommand, "resumeCampaign"],
    [CompleteCampaignCommand, "completeCampaign"],
    [CancelScheduleCommand, "cancelSchedule"],
  ] as const)(
    "forwards scoped lifecycle commands through %s",
    async (Command, method) => {
      await new Command(repository).execute({
        id: "record-1",
        organizationId: "org-1",
      });
      expect(repository[method]).toHaveBeenCalledWith("record-1", "org-1");
    },
  );

  it("clones a campaign without leaking attribution into its definition", async () => {
    await new CloneCampaignCommand(repository).execute({
      id: "campaign-1",
      organizationId: "org-1",
      createdById: "user-1",
      name: "Copy",
      type: "TEMPLATE",
      targetGroupId: null,
    });
    expect(repository.cloneCampaign).toHaveBeenCalledWith(
      "campaign-1",
      "org-1",
      "user-1",
      { name: "Copy", type: "TEMPLATE", targetGroupId: null },
    );
  });

  it("creates a schedule in the active organization", async () => {
    await new CreateScheduleCommand(repository).execute({
      ...scheduleDefinition,
      organizationId: "org-1",
      createdById: "user-1",
    });
    expect(repository.createSchedule).toHaveBeenCalledWith(
      "org-1",
      "user-1",
      scheduleDefinition,
    );
  });

  it("updates a schedule", async () => {
    await new UpdateScheduleCommand(repository).execute({
      id: "schedule-1",
      organizationId: "org-1",
      data: scheduleDefinition,
    });
    expect(repository.updateSchedule).toHaveBeenCalledWith(
      "schedule-1",
      "org-1",
      scheduleDefinition,
    );
  });

  it("duplicates a schedule with new creator attribution", async () => {
    await new DuplicateScheduleCommand(repository).execute({
      id: "schedule-1",
      organizationId: "org-1",
      createdById: "user-1",
    });
    expect(repository.duplicateSchedule).toHaveBeenCalledWith(
      "schedule-1",
      "org-1",
      "user-1",
    );
  });

  it("materializes an occurrence with its complete attribution", async () => {
    const occurrenceAt = new Date("2030-01-01T12:00:00Z");
    await new MaterializeOccurrenceCommand(repository).execute({
      scheduleId: "schedule-1",
      sourceCampaignId: "campaign-1",
      occurrenceAt,
      organizationId: "org-1",
      createdById: "user-1",
    });
    expect(repository.materializeOccurrence).toHaveBeenCalledWith(
      "schedule-1",
      "campaign-1",
      occurrenceAt,
      "org-1",
      "user-1",
    );
  });
});
