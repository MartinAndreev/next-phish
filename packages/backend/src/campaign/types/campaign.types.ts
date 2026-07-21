export type CampaignType = "TEMPLATE" | "CONCRETE";

export type CampaignStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "SCHEDULED"
  | "PENDING_START"
  | "ACTIVE"
  | "PAUSED"
  | "COMPLETED"
  | "FAILED";

export type ConcreteCampaignTransitionStatus =
  | "PENDING_START"
  | "ACTIVE"
  | "PAUSED";
