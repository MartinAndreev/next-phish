"use client";

import { ChangePasswordForm } from "./change-password-form";
import { TwoFactorContainer } from "./two-factor";

interface SecurityTabProps {
  user: {
    id: string;
    email: string;
    twoFactorEnabled?: boolean | null;
  };
}

export function SecurityTab({ user }: SecurityTabProps) {
  return (
    <div className="space-y-10 max-w-lg">
      <section>
        <h2 className="mb-4 text-lg font-medium text-white">Change Password</h2>
        <ChangePasswordForm />
      </section>

      <hr className="border-white/10" />

      <section>
        <TwoFactorContainer user={user} />
      </section>
    </div>
  );
}
