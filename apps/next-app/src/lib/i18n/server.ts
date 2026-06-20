import "server-only";
import { cookies, headers } from "next/headers";
import { auth } from "@/src/server/auth";
import {
  DEFAULT_LOCALE,
  detectLocale,
  isLocale,
  LOCALE_COOKIE_NAME,
  type Locale,
} from "./config";
import { createTranslator } from "./shared";

export async function getLocale(): Promise<Locale> {
  const [cookieStore, requestHeaders] = await Promise.all([
    cookies(),
    headers(),
  ]);

  const cookieLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  if (isLocale(cookieLocale)) {
    return cookieLocale;
  }

  const session = await auth.api.getSession({ headers: requestHeaders });
  const sessionLocale = session?.user?.language;
  if (isLocale(sessionLocale)) {
    return sessionLocale;
  }

  return detectLocale(requestHeaders.get("accept-language")) ?? DEFAULT_LOCALE;
}

export async function getTranslator() {
  return createTranslator(await getLocale());
}
