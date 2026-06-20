"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "primereact/menu";
import { Tooltip } from "primereact/tooltip";
import type { MenuItem } from "primereact/menuitem";
import type { OrganizationView } from "@next-phish/backend";
import { canManageOrganizations } from "@/src/lib/organization-helpers";
import { useTranslation } from "@/src/lib/i18n";

interface NavItem {
  label: string;
  icon: string;
  href: string;
}

interface SidebarMenuProps {
  collapsed?: boolean;
  role?: string | null;
  organizations?: OrganizationView[];
}

function buildMenuItems(
  items: NavItem[],
  pathname: string,
  collapsed?: boolean,
): MenuItem[] {
  return items.map((item) => ({
    template: () => {
      const isActive = pathname === item.href;
      if (collapsed) {
        return (
          <>
            <Tooltip
              target={`.nav-icon-${item.icon.replace(/\s+/g, "-")}`}
              content={item.label}
              position="right"
            />
            <Link
              href={item.href}
              className={`nav-icon-${item.icon.replace(/\s+/g, "-")} flex w-full items-center justify-center rounded-lg p-2.5 transition-colors ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-zinc-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <i className={`${item.icon} text-lg`} />
            </Link>
          </>
        );
      }
      return (
        <Link
          href={item.href}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
            isActive
              ? "bg-white/10 text-white"
              : "text-zinc-300 hover:bg-white/5 hover:text-white"
          }`}
        >
          <i className={`${item.icon} text-base`} />
          <span>{item.label}</span>
        </Link>
      );
    },
  }));
}

function buildGroup(
  label: string,
  items: NavItem[],
  pathname: string,
  collapsed?: boolean,
): MenuItem[] {
  return [
    ...(collapsed
      ? []
      : [
          {
            template: () => (
              <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                {label}
              </p>
            ),
          },
        ]),
    ...buildMenuItems(items, pathname, collapsed),
  ];
}

const EMPTY_ORGANIZATIONS: OrganizationView[] = [];

export function SidebarMenu({
  collapsed,
  role,
  organizations = EMPTY_ORGANIZATIONS,
}: SidebarMenuProps) {
  const t = useTranslation();
  const pathname = usePathname();

  const dashboardItems: NavItem[] = [
    { label: t("common.dashboard"), icon: "pi pi-home", href: "/" },
  ];

  const planningItems: NavItem[] = [
    { label: t("nav.tasks"), icon: "pi pi-check-square", href: "/tasks" },
    { label: t("nav.schedule"), icon: "pi pi-calendar", href: "/schedule" },
  ];

  const simulationItems: NavItem[] = [
    { label: t("nav.campaigns"), icon: "pi pi-bolt", href: "/campaigns" },
    { label: t("nav.pages"), icon: "pi pi-file", href: "/pages" },
    {
      label: t("nav.emailTemplates"),
      icon: "pi pi-envelope",
      href: "/email-templates",
    },
    {
      label: t("nav.sendingProfiles"),
      icon: "pi pi-send",
      href: "/sending-profiles",
    },
    {
      label: t("nav.targetGroups"),
      icon: "pi pi-users",
      href: "/target-groups",
    },
  ];

  const managementItems: NavItem[] = [
    {
      label: t("nav.organizations"),
      icon: "pi pi-building",
      href: "/organizations",
    },
  ];

  const adminItems: NavItem[] = [
    { label: t("nav.users"), icon: "pi pi-user", href: "/users" },
    { label: t("common.settings"), icon: "pi pi-cog", href: "/settings" },
  ];

  const canManageOrgs = canManageOrganizations(organizations);

  const items: MenuItem[] = [
    ...buildMenuItems(dashboardItems, pathname, collapsed),
    { separator: true },
    ...buildGroup(t("nav.planning"), planningItems, pathname, collapsed),
    { separator: true },
    ...buildGroup(t("nav.simulations"), simulationItems, pathname, collapsed),
    ...(canManageOrgs
      ? [
          { separator: true },
          ...buildGroup(
            t("nav.management"),
            managementItems,
            pathname,
            collapsed,
          ),
        ]
      : []),
    ...(role === "admin"
      ? [
          { separator: true },
          ...buildGroup(
            t("nav.administration"),
            adminItems,
            pathname,
            collapsed,
          ),
        ]
      : []),
  ];

  return (
    <nav
      className={`flex-1 overflow-y-auto ${collapsed ? "px-2 py-3" : "px-3 py-4"}`}
    >
      <Menu model={items} />
    </nav>
  );
}
