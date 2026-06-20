import type { OrganizationView } from "@next-phish/backend";

export function canManageOrganizations(
  organizations: OrganizationView[],
): boolean {
  return organizations.some(
    (org) => org.$me.role === "owner" || org.$me.role === "admin",
  );
}
