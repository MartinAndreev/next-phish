import { createHash } from "node:crypto";
import type { ScheduleDefinitionInput } from "../validations";

export class CampaignService {
  normalizeRecipientEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  createScheduleFingerprint(data: ScheduleDefinitionInput): string {
    const stable = JSON.stringify({
      ...data,
      sourceCampaignIds: [...data.sourceCampaignIds],
      startsAt: data.startsAt.toISOString(),
      endsAt: data.endsAt?.toISOString() ?? null,
    });
    return createHash("sha256").update(stable).digest("hex");
  }
}
