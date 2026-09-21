import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { LANGUAGES, type Language } from "@mentor/shared";
import { en } from "./locales/en";
import { ur } from "./locales/ur";

/** RTL languages among the supported set (spec section 16). */
export const RTL_LANGUAGES: Language[] = ["ur", "sd", "ps"];

const STORAGE_KEY = "mo_lang";

export function getStoredLanguage(): Language {
  const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
  return stored && LANGUAGES.includes(stored) ? stored : "en";
}

export function applyDirection(lang: Language) {
  const dir = RTL_LANGUAGES.includes(lang) ? "rtl" : "ltr";
  document.documentElement.setAttribute("dir", dir);
  document.documentElement.setAttribute("lang", lang);
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ur: { translation: ur },
    // sd / ps resources plug in here as they are translated (architecture ready).
  },
  lng: getStoredLanguage(),
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export function changeLanguage(lang: Language) {
  localStorage.setItem(STORAGE_KEY, lang);
  void i18n.changeLanguage(lang);
  applyDirection(lang);
}

applyDirection(getStoredLanguage());

export default i18n;
