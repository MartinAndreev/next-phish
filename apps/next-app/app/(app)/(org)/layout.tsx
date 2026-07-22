import { redirect } from "next/navigation";
import { getRequestOrganizations } from "@/src/server/request-organizations";
import { AppShell } from "@/src/components/organisms/app-shell";
import { getRequiredSession } from "@/src/server/get-required-session";

// Organization data and redirects happen here, so org routes must not be prerendered at build.
export const dynamic = "force-dynamic";

export default async function OrganizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, { organizations, total }] = await Promise.all([
    getRequiredSession(),
    getRequestOrganizations(100, 0),
  ]);

  if (organizations.length === 0) {
    redirect("/onboarding");
  }

  return (
    <AppShell
      user={session.user}
      organizations={organizations}
      organizationTotal={total}
    >
      {children}
    </AppShell>
  );
}
