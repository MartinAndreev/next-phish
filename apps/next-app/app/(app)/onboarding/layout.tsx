import { redirect } from "next/navigation";
import { createServerCaller } from "@/src/server/trpc/server";

// Onboarding checks organization state on the server, so this segment must stay dynamic.
export const dynamic = "force-dynamic";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const caller = await createServerCaller();
  const { organizations } = await caller.organization.list({
    limit: 100,
    offset: 0,
  });

  if (organizations.length > 0) {
    redirect("/");
  }

  return children;
}
