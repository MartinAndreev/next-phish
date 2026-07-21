import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CampaignRepository } from "../../../src/campaign/repositories";
import {
  GetCampaignQuery,
  GetScheduleQuery,
  GetScheduleTimelineQuery,
  ListCampaignsQuery,
  ListSchedulesQuery,
} from "../../../src/campaign/queries";

describe("campaign queries", () => {
  const repository = {
    listCampaigns: vi.fn(),
    getCampaign: vi.fn(),
    listSchedules: vi.fn(),
    getSchedule: vi.fn(),
    getScheduleTimeline: vi.fn(),
  } as unknown as CampaignRepository;

  beforeEach(() => vi.clearAllMocks());

  it("lists organization campaigns with the supplied filters", async () => {
    const result = { rows: [], total: 0 };
    vi.mocked(repository.listCampaigns).mockResolvedValue(result);

    await expect(
      new ListCampaignsQuery(repository).execute({
        organizationId: "org-1",
        type: "TEMPLATE",
        status: "PUBLISHED",
        search: "security",
        filters: { type: "TEMPLATE", status: "PUBLISHED" },
        sort: [{ field: "updatedAt", order: "desc" }],
        limit: 25,
        offset: 50,
      }),
    ).resolves.toBe(result);
    expect(repository.listCampaigns).toHaveBeenCalledWith("org-1", {
      type: "TEMPLATE",
      status: "PUBLISHED",
      search: "security",
      filters: { type: "TEMPLATE", status: "PUBLISHED" },
      sort: [{ field: "updatedAt", order: "desc" }],
      limit: 25,
      offset: 50,
    });
  });

  it("gets one organization campaign", async () => {
    vi.mocked(repository.getCampaign).mockResolvedValue(null);

    await new GetCampaignQuery(repository).execute({
      id: "campaign-1",
      organizationId: "org-1",
    });
    expect(repository.getCampaign).toHaveBeenCalledWith("campaign-1", "org-1");
  });

  it("lists organization schedules with pagination", async () => {
    const result = { rows: [], total: 0 };
    vi.mocked(repository.listSchedules).mockResolvedValue(result);

    await expect(
      new ListSchedulesQuery(repository).execute({
        organizationId: "org-1",
        search: "quarterly",
        filters: { type: "RECURRING", status: "SCHEDULED" },
        sort: [{ field: "startsAt", order: "asc" }],
        limit: 20,
        offset: 40,
      }),
    ).resolves.toBe(result);
    expect(repository.listSchedules).toHaveBeenCalledWith("org-1", {
      search: "quarterly",
      filters: { type: "RECURRING", status: "SCHEDULED" },
      sort: [{ field: "startsAt", order: "asc" }],
      limit: 20,
      offset: 40,
    });
  });

  it("gets the schedule timeline for an organization and date range", async () => {
    const result = { schedules: [], campaigns: [] };
    const startsAt = new Date("2026-08-01T00:00:00.000Z");
    const endsAt = new Date("2026-11-01T00:00:00.000Z");
    vi.mocked(repository.getScheduleTimeline).mockResolvedValue(result);

    await expect(
      new GetScheduleTimelineQuery(repository).execute({
        organizationId: "org-1",
        startsAt,
        endsAt,
      }),
    ).resolves.toBe(result);
    expect(repository.getScheduleTimeline).toHaveBeenCalledWith(
      "org-1",
      startsAt,
      endsAt,
    );
  });

  it("gets one organization schedule", async () => {
    vi.mocked(repository.getSchedule).mockResolvedValue(null);

    await new GetScheduleQuery(repository).execute({
      id: "schedule-1",
      organizationId: "org-1",
    });
    expect(repository.getSchedule).toHaveBeenCalledWith("schedule-1", "org-1");
  });
});
