export interface OrganizationView {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  createdAt: Date;
  $me: {
    id: string;
    userId: string;
    role: string;
    createdAt: Date;
  };
}

export interface OrganizationAnalyticsMonth {
  month: string;
  campaigns: number;
  sent: number;
  opened: number;
  clicked: number;
  submitted: number;
  reported: number;
  failed: number;
}

export interface OrganizationAnalyticsView {
  months: OrganizationAnalyticsMonth[];
}

export interface OrganizationDashboardView {
  periodDays: number;
  metrics: {
    activeCampaigns: number;
    recipientsTargeted: number;
    delivered: number;
    deliveryRate: number;
    riskRecipients: number;
    riskRate: number;
    reportedRecipients: number;
    reportingRate: number;
  };
  funnel: {
    scheduled: number;
    sent: number;
    opened: number;
    clicked: number;
    submitted: number;
    reported: number;
  };
  attention: {
    deliveryDisabled: boolean;
    brokenCampaigns: number;
    failedDeliveries: number;
  };
  readiness: {
    campaigns: number;
    targetGroups: number;
    emailTemplates: number;
    pages: number;
    sendingProfiles: number;
  };
}

export interface CreateOrganizationData {
  name: string;
  slug: string;
}

export interface OrganizationWithMembers {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  createdAt: Date;
  members: {
    id: string;
    userId: string;
    role: string;
    createdAt: Date;
  }[];
}
