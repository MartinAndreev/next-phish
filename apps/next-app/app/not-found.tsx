import Link from "next/link";
import { getTranslator } from "@/src/lib/i18n/server";

export default async function NotFound() {
  const t = await getTranslator();

  return (
    <div className="relative isolate flex min-h-full flex-1 items-center justify-center overflow-hidden bg-brand-navy px-4 py-10">
      <div className="absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,rgba(41,184,255,0.22),transparent_65%)]" />
      <div className="absolute -left-20 top-24 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="absolute -right-16 bottom-16 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="text-center">
        <h1 className="text-8xl font-bold tracking-tight text-white">404</h1>
        <div className="mx-auto my-5 h-1.5 w-24 rounded-full bg-(image:--brand-gradient)" />
        <p className="mt-4 text-lg text-zinc-400">{t("notFound.title")}</p>
        <p className="mt-2 text-sm text-zinc-500">
          {t("notFound.description")}
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-xl border-0 bg-[image:var(--brand-gradient)] bg-[length:300%_100%] bg-[position:0%_50%] bg-no-repeat px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(41,184,255,0.25)] transition-transform duration-200 hover:-translate-y-0.5 hover:animate-[gradient-flow_3s_linear_infinite]"
        >
          {t("notFound.backToDashboard")}
        </Link>
      </div>
    </div>
  );
}
