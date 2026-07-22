import { redirect } from "next/navigation";
import { InitialPasswordContainer } from "@/src/components/organisms/initial-password";
import { getRequiredSession } from "@/src/server/get-required-session";

export const dynamic = "force-dynamic";

export default async function InitialPasswordPage() {
  const session = await getRequiredSession();
  if (!session.userState.passwordSetupRequired) redirect("/");

  return (
    <main className="flex min-h-full flex-1 items-center justify-center bg-brand-navy px-4 py-10">
      <section className="w-full max-w-lg rounded-3xl border border-white/10 bg-brand-dark p-8 shadow-2xl">
        <div className="mb-7 h-1.5 w-24 rounded-full bg-(image:--brand-gradient)" />
        <h1 className="text-3xl font-semibold text-white">
          Set your initial password
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Before you can access organizations or any other data, secure your new
          account with a password.
        </p>
        <div className="mt-7">
          <InitialPasswordContainer />
        </div>
      </section>
    </main>
  );
}
