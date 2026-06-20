import Link from "next/link";
import { getTranslator } from "@/src/lib/i18n/server";

export default async function SignOutPage() {
  const t = await getTranslator();

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-brand-navy px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-brand-dark p-8 shadow-[0_24px_80px_rgba(2,11,29,0.55)]">
        <h1 className="text-2xl font-semibold text-white">
          {t("signoutPage.title")}
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          {t("signoutPage.description")}
        </p>

        <form action="/api/signout" method="post" className="mt-6">
          <button
            type="submit"
            className="w-full rounded-xl bg-cyan-400 px-4 py-3 text-sm font-medium text-brand-navy transition-colors hover:bg-cyan-300"
          >
            {t("signoutPage.action")}
          </button>
        </form>

        <Link
          href="/login"
          className="mt-4 block text-center text-sm text-cyan-300 underline"
        >
          {t("common.backToLogin")}
        </Link>
      </div>
    </div>
  );
}
