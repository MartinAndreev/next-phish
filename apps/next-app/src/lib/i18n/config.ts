export const SUPPORTED_LOCALES = ["en", "bg"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE_NAME = "locale";

export function isLocale(value: string | null | undefined): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale);
}

export function detectLocale(
  acceptLanguage: string | null | undefined,
): Locale {
  if (!acceptLanguage) {
    return DEFAULT_LOCALE;
  }

  const normalized = acceptLanguage.toLowerCase();

  if (normalized.includes("bg")) {
    return "bg";
  }

  return DEFAULT_LOCALE;
}
