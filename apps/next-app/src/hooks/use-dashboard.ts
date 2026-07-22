"use client";

import { authClient } from "@/src/lib/auth-client";
import { trpc } from "@/src/lib/trpc";

export function useDashboard() {
  const { data: activeOrganization, isPending: organizationLoading } =
    authClient.useActiveOrganization();
  const dashboard = trpc.organization.dashboard.useQuery(
    { organizationId: activeOrganization?.id ?? "" },
    { enabled: Boolean(activeOrganization?.id) },
  );

  return {
    activeOrganization,
    data: dashboard.data,
    isLoading: organizationLoading || dashboard.isLoading,
    error: dashboard.error,
  };
}
