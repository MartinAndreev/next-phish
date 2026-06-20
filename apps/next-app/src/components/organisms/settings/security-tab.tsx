"use client";

import { ChangePasswordForm } from "./change-password-form";
import { TwoFactorContainer } from "./two-factor/container";
import { useTranslation } from "@/src/lib/i18n";

interface SecurityTabProps {
  user: {
    id: string;
    email: string;
    twoFactorEnabled?: boolean | null;
  };
}

export function SecurityTab({ user }: SecurityTabProps) {
  const t = useTranslation();

  return (
    <div className="space-y-10 max-w-lg">
      <section>
        <h2 className="mb-4 text-lg font-medium text-white">
          {t("settings.changePassword")}
        </h2>
        <ChangePasswordForm />
      </section>

      <hr className="border-white/10" />

      <section>
        <TwoFactorContainer user={user} />
      </section>
    </div>
  );
}
