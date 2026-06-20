import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/src/server/auth";
import { createServerCaller } from "@/src/server/trpc/server";
import { AppShell } from "@/src/components/organisms/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/login");

  const caller = await createServerCaller();
  const { organizations } = await caller.organization.list({
    limit: 100,
    offset: 0,
  });

  const hasOrg = organizations && organizations.length > 0;

  return (
    <AppShell user={session.user} hasOrg={hasOrg} organizations={organizations}>
      {children}
    </AppShell>
  );
}
