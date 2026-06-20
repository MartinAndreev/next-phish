"use client";

import Link from "next/link";
import { Avatar } from "primereact/avatar";
import { OrgSwitcher } from "./org-switcher";
import { useTranslation } from "@/src/lib/i18n";

interface SidebarProfileProps {
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
  collapsed?: boolean;
}

export function SidebarProfile({ user, collapsed }: SidebarProfileProps) {
  const t = useTranslation();

  if (collapsed) {
    return (
      <div className="border-t border-white/10 p-2">
        <div className="flex flex-col items-center gap-2">
          <Avatar
            image={user.image || undefined}
            label={user.image ? undefined : user.name.charAt(0).toUpperCase()}
            size="normal"
            shape="circle"
            className="profile-avatar bg-cyan-600 text-white"
          />
          <Link
            href="/settings"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
            title={t("common.settings")}
          >
            <i className="pi pi-cog text-sm" />
          </Link>
          <form action="/api/signout" method="post">
            <button
              type="submit"
              aria-label={t("common.signOut")}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
              title={t("common.signOut")}
            >
              <i className="pi pi-sign-out text-sm" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-white/10">
      <OrgSwitcher />
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <Avatar
            image={user.image || undefined}
            label={user.image ? undefined : user.name.charAt(0).toUpperCase()}
            size="normal"
            shape="circle"
            className="bg-cyan-600 text-white"
          />
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-zinc-100">
              {user.name}
            </p>
            <p className="truncate text-xs text-zinc-400">{user.email}</p>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Link
            href="/settings"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <i className="pi pi-cog text-xs" />
            {t("common.settings")}
          </Link>
          <form action="/api/signout" method="post" className="flex flex-1">
            <button
              type="submit"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              <i className="pi pi-sign-out text-xs" />
              {t("common.signOut")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
