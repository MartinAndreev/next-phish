"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/src/lib/auth-client";

export default function SignOutPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"signing-out" | "error">("signing-out");

  useEffect(() => {
    async function doSignOut() {
      const { error } = await authClient.signOut();
      if (error) {
        setStatus("error");
      } else {
        router.push("/login");
      }
    }
    doSignOut();
  }, [router]);

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-brand-navy">
      {status === "signing-out" && (
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          <p className="text-sm text-zinc-400">Signing you out…</p>
        </div>
      )}
      {status === "error" && (
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-red-400">
            Something went wrong. Please try again.
          </p>
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="text-sm text-cyan-300 underline"
          >
            Back to login
          </button>
        </div>
      )}
    </div>
  );
}
