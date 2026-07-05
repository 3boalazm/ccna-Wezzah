// ui/i18n/LanguageContext.tsx
// Site-wide language switch (Arabic default, English toggle). Two things
// happen when the language changes: (1) every UI-chrome string re-resolves
// through t() from dictionary.ts, (2) <html> gets dir="rtl"/"ltr" + lang so
// the browser's bidi algorithm and tokens.css's [dir="rtl"] overrides both
// kick in automatically. Technical terms (protocol names, CLI commands,
// keywords/tags, topic ids) are deliberately NOT part of this system —
// they stay hardcoded English at the call site, per the "translate
// everything except terminology" instruction.

import React, { createContext, useContext, useEffect, useState } from "react";
import { dictionary } from "./dictionary";

export type Lang = "ar" | "en";

interface LanguageContextValue {
  lang: Lang;
  dir: "rtl" | "ltr";
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "ccna-platform-lang";

function getInitialLang(): Lang {
  if (typeof window === "undefined") return "ar";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "ar" || stored === "en") return stored;
  return "ar"; // site default, per explicit request — toggle available to switch to English
}

function resolve(obj: unknown, path: string[]): unknown {
  let cur: unknown = obj;
  for (const key of path) {
    if (cur && typeof cur === "object" && key in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  return cur;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getInitialLang);
  const dir: "rtl" | "ltr" = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.setAttribute("dir", dir);
    document.documentElement.setAttribute("lang", lang);
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore (private mode / quota)
    }
  }, [lang, dir]);

  const setLang = (l: Lang) => setLangState(l);
  const toggleLang = () => setLangState((l) => (l === "ar" ? "en" : "ar"));

  const t = (key: string, vars?: Record<string, string | number>): string => {
    const path = key.split(".");
    const fromLang = resolve(dictionary[lang], path);
    const fromEn = resolve(dictionary.en, path);
    let template = typeof fromLang === "string" ? fromLang : typeof fromEn === "string" ? fromEn : key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        template = template.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), String(v));
      }
    }
    return template;
  };

  return (
    <LanguageContext.Provider value={{ lang, dir, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage() must be used within a <LanguageProvider>");
  return ctx;
}
