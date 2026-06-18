import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/src/server/auth";
import { SettingsContainer } from "@/src/components/organisms/settings";

export default async function SettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/login");

  return (
    <div className="px-6 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-white">Settings</h1>
      <SettingsContainer user={session.user} />
    </div>
  );
}
