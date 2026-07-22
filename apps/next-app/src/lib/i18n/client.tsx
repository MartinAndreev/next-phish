"use client";

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getMessages } from "./shared";
import { LOCALE_COOKIE_NAME, type Locale } from "./config";
import {
  formatMessage,
  resolveMessage,
  type TranslationFunction,
  type Messages,
} from "./shared";

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

  const t = useCallback<TranslationFunction>(
    (key, params) => formatMessage(resolveMessage(messages, key), params),
    [messages],
  );
  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
    setMessages(getMessages(nextLocale));
    writeLocaleCookie(nextLocale);
  }, []);
  const value = useMemo<I18nContextValue>(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  );

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
