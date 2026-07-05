// ui/components/ThemeToggle.tsx
// Light/dark toggle — same behavior pattern as the HLOS reference
// (localStorage-persisted, respects prefers-color-scheme on first load),
// adapted to toggle a `data-theme` attribute on <html> since this project's
// tokens.css keys dark-mode overrides off `[data-theme="dark"]` rather than
// a `.dark` class.

import React, { useEffect, useState } from "react";
import { SunIcon, MoonIcon } from "./icons";

const STORAGE_KEY = "ccna-platform-theme";

function getInitialTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function ThemeToggle({ style }: { style?: React.CSSProperties }) {
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore (private mode / quota)
    }
  }, [theme]);

  return (
    <button
      type="button"
      onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="ccna-hoverable ccna-press"
      style={{ ...S.btn, ...style }}
    >
      {theme === "dark" ? <SunIcon size={15} /> : <MoonIcon size={15} />}
    </button>
  );
}

const S: Record<string, React.CSSProperties> = {
  btn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "var(--card-bg)",
    color: "var(--text-secondary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
  },
};
