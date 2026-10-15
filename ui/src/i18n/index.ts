import i18n, { type InitOptions, type TOptions } from "i18next";
import { initReactI18next, useTranslation as useReactI18nextTranslation } from "react-i18next";

import { DEFAULT_LOCALE, i18nextResources, supportedLocales } from "./locales";

const LANGUAGE_STORAGE_KEY = "paperclip-lang";

function isSupportedLocale(lang: string) {
  return supportedLocales.includes(lang);
}

function readStoredLanguage() {
  try {
    if (typeof localStorage === "undefined") return DEFAULT_LOCALE;
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && isSupportedLocale(stored)) return stored;
  } catch {
    // Storage can throw when access is denied.
  }
  return DEFAULT_LOCALE;
}

const i18nextOptions: InitOptions = {
  resources: i18nextResources,
  lng: readStoredLanguage(),
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: supportedLocales,
  defaultNS: "translation",
  interpolation: { escapeValue: false },
  returnObjects: false,
  initAsync: false,
};

void i18n.use(initReactI18next).init(i18nextOptions).catch((error: unknown) => {
  console.error("Failed to initialize i18next", error);
});

export function setLanguage(lang: string) {
  if (!isSupportedLocale(lang)) return;
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    // Still switch this page when storage is unavailable.
  }
  void i18n.changeLanguage(lang);
}

if (typeof window !== "undefined") {
  Object.assign(window, { setLanguage });
}

export function t(key: string, options: TOptions = {}) {
  return i18n.t(key, options);
}

export const useTranslation = useReactI18nextTranslation;
export { i18n };
