"use client";

import { usePathname } from "next/navigation";
import { useIsMobile } from "@/src/hooks/use-is-mobile";
import { Sidebar } from "./sidebar";
import type { OrganizationView } from "@next-phish/backend";

interface AppShellProps {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    role?: string | null;
  };
  organizations?: OrganizationView[];
  organizationTotal?: number;
  children: React.ReactNode;
}

export function AppShell({
  user,
  organizations,
  organizationTotal,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  return (
    <div className="flex h-dvh overflow-hidden bg-brand-navy">
      <Sidebar
        key={`${pathname}-${isMobile}`}
        user={user}
        isMobile={isMobile}
        organizations={organizations}
        organizationTotal={organizationTotal}
      />

      <main className={`flex-1 overflow-y-auto`}>{children}</main>
    </div>
  );
}
