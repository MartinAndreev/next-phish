import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/src/server/auth";
import { createServerCaller } from "@/src/server/trpc/server";
import { AppShell } from "@/src/components/organisms/app-shell";

// Organization data and redirects happen here, so org routes must not be prerendered at build.
export const dynamic = "force-dynamic";

export default async function OrganizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const caller = await createServerCaller();
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
