import Image from "next/image";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Container } from "@/src/server/container";
import { MessageBus, GetUserCountQuery } from "@next-phish/backend";
import { SetupContainer } from "@/src/components/organisms/setup";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const bus = Container.get(MessageBus);
  const handler = Container.get(GetUserCountQuery);
  const count = await bus.query(handler, {});

  if (count > 0) redirect("/login");

  return (
    <div className="relative isolate flex min-h-full flex-1 items-center justify-center overflow-hidden bg-brand-navy px-4 py-10">
      <div className="absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,_rgba(41,184,255,0.22),_transparent_65%)]" />
      <div className="absolute -left-20 top-24 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="absolute -right-16 bottom-16 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="auth-card rounded-3xl">
        <div className="min-w-[400px] md:min-w-[600px] m-[1px] auth-card__container w-full max-w-md rounded-3xl border border-white/10 bg-brand-dark p-8 shadow-[0_24px_80px_rgba(2,11,29,0.55)] backdrop-blur-xl sm:p-10">
          <div className="mb-8 text-center">
            <Image
              src="/images/logo/logo-icon-only.png"
              alt="NextPhish"
              width={85}
              height={85}
              className="mx-auto mb-6"
              priority
            />
            <div className="mx-auto mb-4 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-cyan-200/80">
              Admin setup
            </div>
            <div className="mx-auto mb-5 h-1.5 w-24 rounded-full bg-(image:--brand-gradient)" />
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              Set up your account
            </h1>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Create the first admin account
            </p>
          </div>
          <SetupContainer />
          <p className="mt-6 text-center text-sm text-zinc-400">
            Already have access?{" "}
            <Link
              href="/login"
              className="font-medium text-cyan-300 transition-colors hover:text-cyan-200"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
