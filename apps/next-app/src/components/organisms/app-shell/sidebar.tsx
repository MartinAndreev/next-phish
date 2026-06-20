"use client";

import { useState, useCallback } from "react";
import { SidebarHeader } from "./sidebar-header";
import { SidebarMenu } from "./sidebar-menu";
import { SidebarProfile } from "./sidebar-profile";
import type { OrganizationView } from "@next-phish/backend";

interface SidebarUser {
  name: string;
  email: string;
  image?: string | null;
  role?: string | null;
}

interface SidebarProps {
  user: SidebarUser;
  isMobile: boolean;
  organizations?: OrganizationView[];
}

export function Sidebar({ user, isMobile, organizations }: SidebarProps) {
  const [userExpanded, setUserExpanded] = useState(false);
  const expand = useCallback(() => setUserExpanded(true), []);
  const collapse = useCallback(() => setUserExpanded(false), []);

  const expanded = isMobile ? userExpanded : true;
  const collapsed = !expanded;

  return (
    <>
      {expanded && isMobile && (
        <button
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          role="button"
          tabIndex={0}
          onClick={collapse}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") collapse();
          }}
          aria-label="Close sidebar"
        >
          <span className="sr-only">Close sidebar</span>
        </button>
      )}

      <aside
        className={`flex shrink-0 flex-col border-r border-white/10 bg-brand-dark transition-all duration-200 ${
          collapsed
            ? "w-14"
            : expanded && isMobile
              ? "fixed inset-y-0 left-0 z-40 w-64 lg:relative lg:w-64"
              : "w-64"
        }`}
      >
        <SidebarHeader
          collapsed={isMobile && collapsed}
          onExpand={isMobile ? expand : undefined}
          onClose={isMobile && !collapsed ? collapse : undefined}
        />
        <SidebarMenu
          collapsed={collapsed}
          role={user.role}
          organizations={organizations}
        />
        <SidebarProfile user={user} collapsed={collapsed} />
      </aside>
    </>
  );
}
