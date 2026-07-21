import type { CampaignEventType } from "@next-phish/shared";
import type { PrismaClient } from "@prisma/client";
import { DeliveryRepository } from "../repositories/delivery.repository";
import { networkContains } from "./network.service";

export class TrackingService {
  constructor(
    private readonly db: PrismaClient,
    private readonly deliveryRepository: DeliveryRepository,
  ) {}

  async resolveLink(
    trackingRef: string,
    linkId: string,
  ): Promise<string | null> {
    const recipient =
      await this.deliveryRepository.findByTrackingRef(trackingRef);
    if (!recipient) return null;
    const link = await this.db.campaignTrackingLink.findUnique({
      where: {
        campaignId_linkId: { campaignId: recipient.campaignId, linkId },
      },
      select: { destinationUrl: true },
    });
    return link?.destinationUrl ?? null;
  }

  async record(input: {
    trackingRef: string;
    type: Extract<
      CampaignEventType,
      "OPENED" | "CLICKED" | "SUBMITTED" | "REPORTED"
    >;
    clientIp: string;
    deduplicationKey: string;
    occurredAt?: Date;
  }): Promise<{ accepted: boolean; ignored: boolean }> {
    const recipient = await this.deliveryRepository.findByTrackingRef(
      input.trackingRef,
    );
    if (
      !recipient ||
      ["COMPLETED", "FAILED"].includes(recipient.campaign.status) ||
      recipient.deliveryStatus === "CANCELLED"
    )
      return { accepted: false, ignored: false };

    if (input.type !== "REPORTED") {
      const networks = await this.db.organizationIgnoredNetwork.findMany({
        where: { organizationId: recipient.organizationId },
        select: { normalizedNetwork: true },
      });
      if (
        networks.some((network) =>
          networkContains(network.normalizedNetwork, input.clientIp),
        )
      )
        return { accepted: true, ignored: true };
    }

    await this.deliveryRepository.recordCampaignEvent({
      campaignRecipientId: recipient.id,
      type: input.type,
      deduplicationKey: input.deduplicationKey,
      occurredAt: input.occurredAt,
    });
    return { accepted: true, ignored: false };
  }
}
