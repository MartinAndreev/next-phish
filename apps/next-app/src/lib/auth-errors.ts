const errorMessages: Record<string, string> = {
  INVALID_TOKEN: "This link is invalid or has already been used.",
  TOKEN_EXPIRED: "This link has expired. Please request a new one.",
  USER_NOT_FOUND: "No account was found for this link.",
  failed_to_create_user: "Account creation failed. Please try again.",
  new_user_signup_disabled: "New sign-ups are currently disabled.",
  failed_to_create_session: "Session creation failed. Please try again.",
  UNAUTHORIZED: "You are not authorized. Please sign in.",
};

const successMessages: Record<string, string> = {
  "check-email": "Account created! Check your email to verify your address.",
  "email-verified": "Email verified! You are now signed in.",
  "password-reset":
    "Password reset successfully! You can now sign in with your new password.",
};

export function getAuthErrorMessage(code: string | undefined): string | null {
  if (!code) return null;
  return errorMessages[code] ?? "Something went wrong. Please try again.";
}

export function getAuthSuccessMessage(code: string | undefined): string | null {
  if (!code) return null;
  return successMessages[code] ?? null;
}
