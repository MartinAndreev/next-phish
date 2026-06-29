import { DEFAULT_LOCALE, type Locale } from "./config";

export interface Messages {
  [key: string]: string | Messages;
}

type TranslationParams = Record<string, string | number>;

import enMessages from "./locales/en.json";
import bgMessages from "./locales/bg.json";

const allMessages: Record<Locale, Messages> = {
  en: enMessages,
  bg: bgMessages,
};

export function getMessages(locale: Locale): Messages {
  return allMessages[locale] ?? allMessages[DEFAULT_LOCALE];
}

export function resolveMessage(messagesObject: Messages, key: string): string {
  const value = key.split(".").reduce<unknown>((current, segment) => {
    if (!current || typeof current !== "object") {
      return undefined;
    }

    return (current as Record<string, unknown>)[segment];
  }, messagesObject);

  if (typeof value !== "string") {
    throw new Error(`Missing translation for key: ${key}`);
  }

  return value;
}

export function formatMessage(
  template: string,
  params?: TranslationParams,
): string {
  if (!params) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = params[key];
    return value === undefined ? `{${key}}` : String(value);
  });
}

export function translate(
  locale: Locale,
  key: string,
  params?: TranslationParams,
): string {
  return formatMessage(resolveMessage(getMessages(locale), key), params);
}

export function createTranslator(locale: Locale) {
  return (key: string, params?: TranslationParams) =>
    translate(locale, key, params);
}

export type TranslationFunction = ReturnType<typeof createTranslator>;
