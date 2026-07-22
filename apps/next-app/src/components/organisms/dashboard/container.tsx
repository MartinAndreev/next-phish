"use client";

import { useDashboard } from "@/src/hooks/use-dashboard";
import { DashboardPresentation } from "./presentation";

export function DashboardContainer() {
  const { activeOrganization, data, isLoading, error } = useDashboard();

  return (
    <DashboardPresentation
      organizationName={activeOrganization?.name}
      data={data}
      isLoading={isLoading}
      error={error?.message}
    />
  );
}
