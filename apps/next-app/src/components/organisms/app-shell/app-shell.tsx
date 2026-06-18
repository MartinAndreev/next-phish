"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useIsMobile } from "@/src/hooks/use-is-mobile";
import { Sidebar } from "./sidebar";

interface AppShellProps {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    role?: string | null;
  };
  hasOrg: boolean;
  children: React.ReactNode;
}

export function AppShell({ user, hasOrg, children }: AppShellProps) {
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
      />

      <main className={`flex-1 overflow-y-auto ${isMobile ? "pl-14" : ""}`}>
        {children}
      </main>
    </div>
  );
}
