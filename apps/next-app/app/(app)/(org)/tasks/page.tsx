import { getTranslator } from "@/src/lib/i18n/server";

export default async function TasksPage() {
  const t = await getTranslator();

  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-zinc-400">{t("pages.tasksSoon")}</p>
    </div>
  );
}
