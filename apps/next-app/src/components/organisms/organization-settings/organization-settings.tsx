"use client";

import { TabPanel, TabView } from "primereact/tabview";
import type { OrganizationView } from "@next-phish/backend";
import { useTranslation } from "@/src/lib/i18n";
import { GeneralFormContainer } from "./general-form-container";
import { IgnoredNetworksContainer } from "./ignored-networks-container";

interface OrganizationSettingsProps {
  organization: OrganizationView;
}

export function OrganizationSettings({
  organization,
}: OrganizationSettingsProps) {
  const t = useTranslation();

  return (
    <div className="rounded-2xl border border-white/10 bg-brand-dark p-5 shadow-xl">
      <TabView>
        <TabPanel
          header={t("organizations.generalSettings")}
          leftIcon="pi pi-building mr-2"
        >
          <GeneralFormContainer organization={organization} />
        </TabPanel>
        <TabPanel
          header={t("organizations.eventCollection")}
          leftIcon="pi pi-filter mr-2"
        >
          <IgnoredNetworksContainer organizationId={organization.id} />
        </TabPanel>
      </TabView>
    </div>
  );
}
