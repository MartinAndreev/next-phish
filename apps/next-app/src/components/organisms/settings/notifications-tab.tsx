"use client";

import { useTranslation } from "@/src/lib/i18n";

export function NotificationsTab() {
  const t = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <i className="pi pi-bell text-4xl text-zinc-500" />
      <p className="text-sm text-zinc-400">{t("settings.notificationsSoon")}</p>
    </div>
  );
}
