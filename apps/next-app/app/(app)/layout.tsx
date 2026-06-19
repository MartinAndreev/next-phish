import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/src/server/auth";
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

  const organizations = await auth.api.listOrganizations({
    headers: await headers(),
  });

  const hasOrg = organizations && organizations.length > 0;

  return (
    <AppShell user={session.user} hasOrg={hasOrg}>
      {children}
    </AppShell>
  );
}
