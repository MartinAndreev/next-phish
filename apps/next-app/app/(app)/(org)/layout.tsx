import { redirect } from "next/navigation";
import { createServerCaller } from "@/src/server/trpc/server";
import { AppShell } from "@/src/components/organisms/app-shell";
import { getRequiredSession } from "@/src/server/get-required-session";

// Organization data and redirects happen here, so org routes must not be prerendered at build.
export const dynamic = "force-dynamic";

export default async function OrganizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, caller] = await Promise.all([
    getRequiredSession(),
    createServerCaller(),
  ]);

  const { organizations } = await caller.organization.list({
    limit: 100,
    offset: 0,
  });

  if (organizations.length === 0) {
    redirect("/onboarding");
  }

  return (
    <AppShell user={session.user} organizations={organizations}>
      {children}
    </AppShell>
  );
}
