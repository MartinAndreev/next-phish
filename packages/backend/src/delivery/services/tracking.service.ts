import type { CampaignEventType as CampaignEventTypeValue } from "@next-phish/shared";
import type { PrismaClient } from "@prisma/client";
import { DeliveryRepository } from "../repositories/delivery.repository";
import { networkContains } from "./network.service";
import {
  CampaignEventType,
  CampaignStatus,
  RecipientDeliveryStatus,
} from "../execution.enums";

type TrackableCampaignEvent = Extract<
  CampaignEventTypeValue,
  | typeof CampaignEventType.OPENED
  | typeof CampaignEventType.CLICKED
  | typeof CampaignEventType.SUBMITTED
  | typeof CampaignEventType.REPORTED
>;

type TrackingRecordInput = {
  trackingRef: string;
  type: TrackableCampaignEvent;
  clientIp: string;
  deduplicationKey: string;
  occurredAt?: Date;
};

export function attachSubmissionTracking(
  html: string,
  endpoint: string,
): string {
  const script = `<script>(()=>{const endpoint=${JSON.stringify(endpoint)};async function send(){try{const response=await fetch(endpoint,{method:'POST',credentials:'omit',redirect:'manual',keepalive:true}),target=response.headers.get('X-Redirect-To');if(target)window.location.assign(target)}catch{}}document.addEventListener('submit',(event)=>{event.preventDefault();void send()},true);document.addEventListener('click',(event)=>{const button=event.target.closest('button,input[type="submit"],input[type="button"]');if(!button||button.closest('form'))return;let root=button.parentElement;while(root&&root!==document.body&&!root.querySelector('input,select,textarea'))root=root.parentElement;if(!root||!root.querySelector('input,select,textarea'))return;event.preventDefault();void send()},true)})();</script>`;
  return /<\/body\s*>/i.test(html)
    ? html.replace(/<\/body\s*>/i, `${script}</body>`)
    : `${html}${script}`;
}

export class TrackingService {
  constructor(
    private readonly db: PrismaClient,
    private readonly deliveryRepository: DeliveryRepository,
  ) {}

  async resolveLandingPage(
    trackingRef: string,
    requestedPath?: string,
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
      select: { html: true, contentType: true, path: true },
    });
    if (!page) return null;
    if (
      requestedPath !== undefined &&
      (page.path ?? "c") !== requestedPath.toLowerCase()
    )
      return null;
    const action = `/s?ref=${encodeURIComponent(trackingRef)}`;
    const formHtml = page.html.replace(
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
      html: attachSubmissionTracking(formHtml, action),
      contentType: page.contentType ?? "text/html; charset=utf-8",
    };
  }

  async resolveSubmissionRedirect(trackingRef: string): Promise<string | null> {
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
      select: {
        redirectUrl: true,
        redirectPage: { select: { redirectUrl: true } },
      },
    });
    return page?.redirectUrl ?? page?.redirectPage?.redirectUrl ?? null;
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

  async enqueueRecord(input: TrackingRecordInput): Promise<void> {
    await this.db.$transaction(async (tx) => {
      const event = await tx.trackingEventInbox.upsert({
        where: { deduplicationKey: input.deduplicationKey },
        create: {
          trackingRef: input.trackingRef,
          type: input.type,
          clientIp: input.clientIp,
          deduplicationKey: input.deduplicationKey,
          occurredAt: input.occurredAt ?? new Date(),
        },
        update: {},
        select: { id: true },
      });
      await tx.outboxEvent.upsert({
        where: { deduplicationKey: `tracking-event:${event.id}` },
        create: {
          topic: "tracking-events",
          deduplicationKey: `tracking-event:${event.id}`,
          payloadVersion: 1,
          payload: { version: 1, trackingEventId: event.id },
        },
        update: {},
      });
    });
  }

  async processQueuedRecord(trackingEventId: string): Promise<void> {
    const event = await this.db.trackingEventInbox.findUnique({
      where: { id: trackingEventId },
    });
    if (!event || event.processedAt) return;
    await this.record({
      trackingRef: event.trackingRef,
      type: event.type as TrackableCampaignEvent,
      clientIp: event.clientIp,
      deduplicationKey: event.deduplicationKey,
      occurredAt: event.occurredAt,
    });
    await this.db.trackingEventInbox.updateMany({
      where: { id: event.id, processedAt: null },
      data: { processedAt: new Date() },
    });
  }

  async record(
    input: TrackingRecordInput,
  ): Promise<{ accepted: boolean; ignored: boolean }> {
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
      const networks = await this.db.ignoredNetwork.findMany({
        where: {
          OR: [
            { organizationId: recipient.organizationId },
            { organizationId: null },
          ],
        },
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
