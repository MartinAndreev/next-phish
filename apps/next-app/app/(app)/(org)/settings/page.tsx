import { SettingsContainer } from "@/src/components/organisms/settings";
import { getRequiredSession } from "@/src/server/get-required-session";
import { getTranslator } from "@/src/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [t, session] = await Promise.all([
    getTranslator(),
    getRequiredSession(),
  ]);

  return (
    <div className="px-6 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-white">
        {t("settings.title")}
      </h1>
      <SettingsContainer user={session.user} />
    </div>
  );
}
