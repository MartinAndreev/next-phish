"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "primereact/menu";
import { Tooltip } from "primereact/tooltip";
import type { MenuItem } from "primereact/menuitem";
import type { OrganizationView } from "@next-phish/backend";
import { canManageOrganizations } from "@/src/lib/organization-helpers";

interface NavItem {
  label: string;
  icon: string;
  href: string;
}

const dashboardItems: NavItem[] = [
  { label: "Dashboard", icon: "pi pi-home", href: "/" },
];

const planningItems: NavItem[] = [
  { label: "Tasks", icon: "pi pi-check-square", href: "/tasks" },
  { label: "Schedule", icon: "pi pi-calendar", href: "/schedule" },
];

const simulationItems: NavItem[] = [
  { label: "Campaigns", icon: "pi pi-bolt", href: "/campaigns" },
  { label: "Pages", icon: "pi pi-file", href: "/pages" },
  {
    label: "Email templates",
    icon: "pi pi-envelope",
    href: "/email-templates",
  },
  { label: "Sending Profiles", icon: "pi pi-send", href: "/sending-profiles" },
  { label: "Target Groups", icon: "pi pi-users", href: "/target-groups" },
];

const managementItems: NavItem[] = [
  { label: "Organizations", icon: "pi pi-building", href: "/organizations" },
];

const adminItems: NavItem[] = [
  { label: "Users", icon: "pi pi-user", href: "/users" },
  { label: "Settings", icon: "pi pi-cog", href: "/settings" },
];

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
  const pathname = usePathname();

  const canManageOrgs = canManageOrganizations(organizations);

  const items: MenuItem[] = [
    ...buildMenuItems(dashboardItems, pathname, collapsed),
    { separator: true },
    ...buildGroup("Planning", planningItems, pathname, collapsed),
    { separator: true },
    ...buildGroup("Simulations", simulationItems, pathname, collapsed),
    ...(canManageOrgs
      ? [
          { separator: true },
          ...buildGroup("Management", managementItems, pathname, collapsed),
        ]
      : []),
    ...(role === "admin"
      ? [
          { separator: true },
          ...buildGroup("Administration", adminItems, pathname, collapsed),
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
