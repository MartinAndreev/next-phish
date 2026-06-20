import { type Locale, translate } from "@/src/lib/i18n";

const errorMessages: Record<string, string> = {
  INVALID_TOKEN: "authErrors.invalidToken",
  TOKEN_EXPIRED: "authErrors.tokenExpired",
  USER_NOT_FOUND: "authErrors.userNotFound",
  failed_to_create_user: "authErrors.failedToCreateUser",
  new_user_signup_disabled: "authErrors.signupDisabled",
  failed_to_create_session: "authErrors.failedToCreateSession",
  UNAUTHORIZED: "authErrors.unauthorized",
};

const successMessages: Record<string, string> = {
  "check-email": "authErrors.checkEmail",
  "email-verified": "authErrors.emailVerified",
  "password-reset": "authErrors.passwordReset",
};

export function getAuthErrorMessage(
  code: string | undefined,
  locale: Locale,
): string | null {
  if (!code) return null;
  return translate(locale, errorMessages[code] ?? "authErrors.generic");
}

export function getAuthSuccessMessage(
  code: string | undefined,
  locale: Locale,
): string | null {
  if (!code) return null;
  return successMessages[code]
    ? translate(locale, successMessages[code])
    : null;
}
