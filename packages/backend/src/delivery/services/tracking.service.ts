import type { CampaignEventType as CampaignEventTypeValue } from "@next-phish/shared";
import type { PrismaClient } from "@prisma/client";
import { DeliveryRepository } from "../repositories/delivery.repository";
import { networkContains } from "./network.service";
import {
  CampaignEventType,
  CampaignStatus,
  RecipientDeliveryStatus,
} from "../execution.enums";

export class TrackingService {
  constructor(
    private readonly db: PrismaClient,
    private readonly deliveryRepository: DeliveryRepository,
  ) {}

  async resolveLandingPage(
    trackingRef: string,
  ): Promise<{ html: string; contentType: string } | null> {
    const recipient =
      await this.deliveryRepository.findByTrackingRef(trackingRef);
    if (
      !recipient?.campaign.pageId ||
      recipient.deliveryStatus === RecipientDeliveryStatus.CANCELLED
    )
      return null;
    const page = await this.db.page.findFirst({
      where: {
        id: recipient.campaign.pageId,
        organizationId: recipient.organizationId,
        visibility: "SHADOW",
      },
      select: { html: true, contentType: true },
    });
    if (!page) return null;
    const action = `/s?ref=${encodeURIComponent(trackingRef)}`;
    const html = page.html.replace(
      /<form\b([^>]*)>/gi,
      (_match, attributes: string) => {
        const withoutAction = attributes.replace(
          /\saction\s*=\s*(["']).*?\1/gi,
          "",
        );
        return `<form${withoutAction} action="${action}" method="post">`;
      },
    );
    return {
      html,
      contentType: page.contentType ?? "text/html; charset=utf-8",
    };
  }

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
      CampaignEventTypeValue,
      | typeof CampaignEventType.OPENED
      | typeof CampaignEventType.CLICKED
      | typeof CampaignEventType.SUBMITTED
      | typeof CampaignEventType.REPORTED
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
      recipient.campaign.status === CampaignStatus.COMPLETED ||
      recipient.campaign.status === CampaignStatus.FAILED ||
      recipient.deliveryStatus === RecipientDeliveryStatus.CANCELLED
    )
      return { accepted: false, ignored: false };

    if (input.type !== CampaignEventType.REPORTED) {
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
