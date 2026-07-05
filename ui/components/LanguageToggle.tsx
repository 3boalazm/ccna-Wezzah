// ui/components/LanguageToggle.tsx
// AR/EN switch — sits next to ThemeToggle in Sidebar/MobileNav. Shows the
// language it would switch TO (common convention: the button reads "EN"
// while the UI is in Arabic, and vice versa), so it doubles as a language
// indicator without needing a separate label.

import React from "react";
import { useLanguage } from "../i18n/LanguageContext";

export default function LanguageToggle({ style }: { style?: React.CSSProperties }) {
  const { lang, toggleLang, t } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggleLang}
      aria-label={lang === "ar" ? t("common.switchToEnglish") : t("common.switchToArabic")}
      title={lang === "ar" ? t("common.switchToEnglish") : t("common.switchToArabic")}
      className="ccna-hoverable ccna-press"
      style={{ ...S.btn, ...style }}
    >
      {lang === "ar" ? "EN" : "ع"}
    </button>
  );
}

const S: Record<string, React.CSSProperties> = {
  btn: {
    minWidth: 32,
    height: 32,
    padding: "0 7px",
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "var(--card-bg)",
    color: "var(--text-secondary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0,
  },
};
