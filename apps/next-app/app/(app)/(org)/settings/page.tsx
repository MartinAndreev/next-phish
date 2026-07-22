import { SettingsContainer } from "@/src/components/organisms/settings";
import { getTranslator } from "@/src/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const t = await getTranslator();

  return (
    <div className="px-6 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-white">
        {t("settings.applicationTitle")}
      </h1>
      <SettingsContainer />
    </div>
  );
}
