"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
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
  hasOrg: boolean;
  organizations?: OrganizationView[];
  children: React.ReactNode;
}

export function AppShell({
  user,
  hasOrg,
  organizations,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!hasOrg && pathname !== "/onboarding") {
      router.replace("/onboarding");
    } else if (hasOrg && pathname === "/onboarding") {
      router.replace("/");
    }
  }, [hasOrg, pathname, router]);

  if (pathname === "/onboarding") {
    return <>{children}</>;
  }

  if (!hasOrg) {
    return (
      <div className="flex h-screen items-center justify-center bg-brand-navy">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-brand-navy">
      <Sidebar
        key={`${pathname}-${isMobile}`}
        user={user}
        isMobile={isMobile}
        organizations={organizations}
      />

      <main className={`flex-1 overflow-y-auto`}>{children}</main>
    </div>
  );
}
