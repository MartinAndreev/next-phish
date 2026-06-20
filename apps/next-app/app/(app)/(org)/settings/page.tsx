import { SettingsContainer } from "@/src/components/organisms/settings";
import { getRequiredSession } from "@/src/server/get-required-session";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getRequiredSession();

  return (
    <div className="px-6 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-white">Settings</h1>
      <SettingsContainer user={session.user} />
    </div>
  );
}
