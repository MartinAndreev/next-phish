import * as PrismaClientRuntime from "@prisma/client";
import type { $Enums } from "@prisma/client";

const PrismaEnums = PrismaClientRuntime.$Enums;

export const CampaignStatus = PrismaEnums.CampaignStatus;
export const ScheduleStatus = PrismaEnums.ScheduleStatus;
export const ScheduleType = PrismaEnums.ScheduleType;
export const ScheduleSelectionStrategy = PrismaEnums.ScheduleSelectionStrategy;
export const OccurrenceStatus = PrismaEnums.OccurrenceStatus;
export const RecipientDeliveryStatus = PrismaEnums.RecipientDeliveryStatus;
export const NegativeEventSeverity = PrismaEnums.NegativeEventSeverity;
export const CampaignEventType = PrismaEnums.CampaignEventType;
export const DeliveryEventType = PrismaEnums.DeliveryEventType;
export const OutboxStatus = PrismaEnums.OutboxStatus;

export type CampaignStatus = $Enums.CampaignStatus;
export type ScheduleStatus = $Enums.ScheduleStatus;
export type ScheduleType = $Enums.ScheduleType;
export type ScheduleSelectionStrategy = $Enums.ScheduleSelectionStrategy;
export type OccurrenceStatus = $Enums.OccurrenceStatus;
export type RecipientDeliveryStatus = $Enums.RecipientDeliveryStatus;
export type NegativeEventSeverity = $Enums.NegativeEventSeverity;
export type CampaignEventType = $Enums.CampaignEventType;
export type DeliveryEventType = $Enums.DeliveryEventType;
export type OutboxStatus = $Enums.OutboxStatus;
