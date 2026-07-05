// ui/layout/Sidebar.tsx
// Desktop workspace navigation — visual language ported from the HLOS
// "learner" shell at Ahmed's request. Fully bilingual: all chrome text
// goes through t(), and directional styles use CSS logical properties
// (inline-start/end, "start" text-align) instead of physical left/right so
// the whole nav mirrors correctly under RTL with zero special-casing —
// flexbox rows already reverse for free under dir="rtl".

import React, { useMemo, useState } from "react";
import { groupByDomain, domainOf, type Domain } from "./domains";
import { SearchIcon } from "../components/icons";
import ThemeToggle from "../components/ThemeToggle";
import LanguageToggle from "../components/LanguageToggle";
import { useLanguage } from "../i18n/LanguageContext";

export interface SidebarProps {
  topicIds: string[];
  activeTopicId: string;
  onSelectTopic: (topicId: string) => void;
  activeEngine?: string;
  onSelectEngine?: (engineId: string) => void;
  isHomeActive?: boolean;
  onGoHome?: () => void;
}

const DOMAIN_DOT: Record<Domain, string> = {
  routing: "var(--domain-routing)",
  switching: "var(--domain-switching)",
  security: "var(--domain-security)",
  "ip-services": "var(--domain-ip-services)",
  automation: "var(--domain-automation)",
  wireless: "var(--domain-wireless)",
  architecture: "var(--domain-architecture)",
};

export default function Sidebar({
  topicIds,
  activeTopicId,
  onSelectTopic,
  activeEngine,
  onSelectEngine,
  isHomeActive,
  onGoHome,
}: SidebarProps) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Partial<Record<Domain, boolean>>>({});

  const ENGINE_ITEMS = [
    { id: "question-bank", label: t("common.questionBank") },
    { id: "exam", label: t("common.examSimulator") },
    { id: "troubleshooting", label: t("common.scenarioSimulator") },
    { id: "review", label: t("common.reviewDashboard") },
  ];

  const filtered = useMemo(
    () =>
      query.trim()
        ? topicIds.filter((t) => t.toLowerCase().includes(query.trim().toLowerCase()))
        : topicIds,
    [topicIds, query]
  );

  const groups = useMemo(() => groupByDomain(filtered), [filtered]);

  const toggleGroup = (d: Domain) =>
    setCollapsed((prev) => ({ ...prev, [d]: !prev[d] }));

  return (
    <aside className="ccna-desktop-sidebar" style={S.sidebar} aria-label={t("common.appName")}>
      {/* Brand row */}
      <div style={S.brandRow}>
        <button
          type="button"
          onClick={onGoHome}
          style={S.brandMarkBtn}
          className="ccna-hoverable ccna-press"
          aria-label={t("common.goToDashboard")}
          title={t("common.dashboard")}
        >
          C
        </button>
        <div style={S.brandText}>
          <p style={S.brandTitle}>{t("common.appName")}</p>
          <p style={S.brandSubtitle}>{t("common.appTagline")}</p>
        </div>
        <div style={S.headerBtns}>
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>

      <div style={S.searchRow}>
        <SearchIcon size={14} style={S.searchIcon} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("common.searchTopics")}
          style={S.search}
          aria-label={t("common.searchTopics")}
        />
      </div>

      <div style={S.scrollArea}>
        <button
          type="button"
          onClick={onGoHome}
          aria-current={isHomeActive ? "page" : undefined}
          className="ccna-transition-all"
          style={{ ...S.item, paddingInlineStart: 8, marginBottom: 10, ...(isHomeActive ? S.itemActive : null) }}
        >
          <span aria-hidden="true">🏠</span>
          {t("common.dashboard")}
        </button>

        <div style={S.sectionLabel}>{t("common.topics")}</div>
        <div style={S.tree}>
          {groups.map(({ domain, topics }) => (
            <div key={domain}>
              <button
                type="button"
                onClick={() => toggleGroup(domain)}
                style={S.groupHeader}
                aria-expanded={!collapsed[domain]}
              >
                <span style={S.chevron}>{collapsed[domain] ? "\u203A" : "\u2304"}</span>
                {t(`common.domains.${domain}`)}
              </button>
              {!collapsed[domain] && (
                <div>
                  {topics.map((tid) => {
                    const active = tid === activeTopicId;
                    return (
                      <button
                        key={tid}
                        type="button"
                        onClick={() => onSelectTopic(tid)}
                        aria-current={active ? "page" : undefined}
                        className="ccna-transition-all"
                        style={{ ...S.item, ...(active ? S.itemActive : null) }}
                      >
                        <span
                          style={{ ...S.dot, background: DOMAIN_DOT[domainOf(tid)] }}
                          aria-hidden="true"
                        />
                        {tid.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
          {groups.length === 0 && <div style={S.empty}>{t("common.noTopicsMatch", { query })}</div>}
        </div>

        <div style={S.sectionLabel}>{t("common.engines")}</div>
        <div style={S.tree}>
          {ENGINE_ITEMS.map((e) => {
            const active = e.id === activeEngine;
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => onSelectEngine?.(e.id)}
                aria-current={active ? "page" : undefined}
                className="ccna-transition-all"
                style={{ ...S.item, ...(active ? S.itemActive : null) }}
              >
                {e.label}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

const S: Record<string, React.CSSProperties> = {
  sidebar: {
    width: "var(--sidebar-width)",
    minWidth: "var(--sidebar-width)",
    background: "var(--sidebar-bg)",
    borderInlineEnd: "1px solid var(--border)",
    height: "100vh",
    position: "sticky",
    top: 0,
    flexDirection: "column",
    padding: "14px 12px 12px",
    fontFamily: "var(--font-ui)",
    boxSizing: "border-box",
    transition: "background 0.2s ease, border-color 0.2s ease",
  },
  brandRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    paddingBottom: 14,
    marginBottom: 12,
    borderBottom: "1px solid var(--border)",
  },
  headerBtns: { display: "flex", alignItems: "center", gap: 6, flexShrink: 0 },
  brandMarkBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    background: "var(--accent)",
    color: "#fff",
    fontWeight: 700,
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    border: "none",
    cursor: "pointer",
  },
  brandText: { minWidth: 0, flex: 1 },
  brandTitle: { margin: 0, fontSize: 13, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  brandSubtitle: { margin: 0, fontSize: 10.5, color: "var(--text-muted)" },
  searchRow: { position: "relative", marginBottom: 16 },
  searchIcon: { position: "absolute", insetInlineStart: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" },
  search: {
    width: "100%",
    boxSizing: "border-box",
    padding: "7px 10px",
    paddingInlineStart: 30,
    fontSize: 13,
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    background: "var(--card-bg)",
    color: "var(--text-primary)",
  },
  scrollArea: { flex: 1, overflowY: "auto" },
  sectionLabel: {
    fontSize: 10.5,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: "var(--text-muted)",
    padding: "10px 8px 6px",
  },
  tree: { display: "flex", flexDirection: "column", gap: 1 },
  groupHeader: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    width: "100%",
    textAlign: "start",
    padding: "6px 8px",
    fontSize: 12.5,
    fontWeight: 600,
    color: "var(--text-secondary)",
    background: "transparent",
    border: "none",
    borderRadius: "var(--radius)",
    cursor: "pointer",
  },
  chevron: { width: 12, display: "inline-block", color: "var(--text-muted)" },
  item: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    textAlign: "start",
    padding: "7px 8px",
    paddingInlineStart: 25,
    fontSize: 13,
    fontWeight: 500,
    color: "var(--text-secondary)",
    background: "transparent",
    border: "none",
    borderInlineStart: "2px solid transparent",
    borderRadius: "var(--radius)",
    cursor: "pointer",
  },
  itemActive: {
    background: "var(--accent-bg)",
    color: "var(--accent-text)",
    fontWeight: 600,
    borderInlineStart: "2px solid var(--accent)",
  },
  dot: { width: 7, height: 7, borderRadius: "50%", flexShrink: 0 },
  empty: { padding: "8px", fontSize: 12.5, color: "var(--text-muted)" },
};
