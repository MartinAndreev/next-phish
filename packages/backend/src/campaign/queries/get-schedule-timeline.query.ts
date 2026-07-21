import { CampaignRepository } from "../repositories";

export class GetScheduleTimelineQuery {
  constructor(private readonly repository: CampaignRepository) {}

  execute(data: { organizationId: string; startsAt: Date; endsAt: Date }) {
    return this.repository.getScheduleTimeline(
      data.organizationId,
      data.startsAt,
      data.endsAt,
    );
  }
}
