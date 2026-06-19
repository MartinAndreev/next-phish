"use client";

import { TabView, TabPanel } from "primereact/tabview";
import { GeneralTab } from "./general-tab";
import { SecurityTab } from "./security-tab";
import { NotificationsTab } from "./notifications-tab";

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
  return (
    <TabView>
      <TabPanel header="General" leftIcon="pi pi-user mr-2">
        <GeneralTab user={user} />
      </TabPanel>
      <TabPanel header="Security" leftIcon="pi pi-shield mr-2">
        <SecurityTab user={user} />
      </TabPanel>
      <TabPanel header="Notifications" leftIcon="pi pi-bell mr-2">
        <NotificationsTab />
      </TabPanel>
    </TabView>
  );
}
