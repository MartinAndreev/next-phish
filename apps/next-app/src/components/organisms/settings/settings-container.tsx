"use client";

import { TabView, TabPanel } from "primereact/tabview";
import { GeneralTab } from "./general-tab";
import { SecurityTab } from "./security-tab";
import { NotificationsTab } from "./notifications-tab";
import { ApiKeyList } from "./api-key-list";
import { useTranslation } from "@/src/lib/i18n";

interface SettingsContainerProps {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    role?: string | null;
    timezone?: string | null;
    language?: string | null;
    twoFactorEnabled?: boolean | null;
  };
}

export function SettingsContainer({ user }: SettingsContainerProps) {
  const t = useTranslation();

  return (
    <TabView>
      <TabPanel header={t("settings.general")} leftIcon="pi pi-user mr-2">
        <GeneralTab user={user} />
      </TabPanel>
      <TabPanel header={t("settings.security")} leftIcon="pi pi-shield mr-2">
        <SecurityTab user={user} />
      </TabPanel>
      <TabPanel header={t("settings.apiKeys")} leftIcon="pi pi-key mr-2">
        <ApiKeyList />
      </TabPanel>
      <TabPanel header={t("settings.notifications")} leftIcon="pi pi-bell mr-2">
        <NotificationsTab />
      </TabPanel>
    </TabView>
  );
}
