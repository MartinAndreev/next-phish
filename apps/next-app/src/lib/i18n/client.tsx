"use client";

import { createContext, use, useEffect, useState, type ReactNode } from "react";
import { getMessages } from "./shared";
import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, type Locale } from "./config";
import {
  formatMessage,
  resolveMessage,
  type TranslationFunction,
} from "./shared";
import type { Messages } from "./messages";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslationFunction;
}

const I18nContext = createContext<I18nContextValue | null>(null);

interface I18nProviderProps {
  initialLocale: Locale;
  children: ReactNode;
}

function writeLocaleCookie(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

export function I18nProvider({ initialLocale, children }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [messages, setMessages] = useState<Messages>(() =>
    getMessages(initialLocale),
  );

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t: TranslationFunction = (key, params) =>
    formatMessage(resolveMessage(messages, key), params);

  const value: I18nContextValue = {
    locale,
    setLocale: (nextLocale) => {
      setLocaleState(nextLocale);
      setMessages(getMessages(nextLocale));
      writeLocaleCookie(nextLocale);
    },
    t,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = use(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }

  return context;
}

export function useTranslation() {
  return useI18n().t;
}

export function useLocale() {
  return useI18n().locale;
}

export function useSetLocale() {
  return useI18n().setLocale;
}

export const fallbackLocale = DEFAULT_LOCALE;
