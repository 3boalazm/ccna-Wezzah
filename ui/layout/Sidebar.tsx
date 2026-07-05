// ui/layout/Sidebar.tsx
// Desktop workspace navigation — visual language ported from the HLOS
// "learner" shell (Ahmed's own product) at his request: brand mark square,
// role/workspace identity block, search + theme-toggle icon buttons in the
// header row, uppercase tracked section labels ("Topics" / "Engines"),
// and an active-item treatment of tinted background + accent-colored side
// border instead of a flat highlight. Hidden below 860px in favor of
// MobileNav's floating glass pill (see ui/layout/MobileNav.tsx).

import React, { useMemo, useState } from "react";
import { groupByDomain, DOMAIN_LABELS, domainOf, type Domain } from "./domains";
import { SearchIcon } from "../components/icons";
import ThemeToggle from "../components/ThemeToggle";

export interface SidebarProps {
  topicIds: string[];
  activeTopicId: string;
  onSelectTopic: (topicId: string) => void;
  activeEngine?: string;
  onSelectEngine?: (engineId: string) => void;
}

const ENGINE_ITEMS = [
  { id: "question-bank", label: "Question bank" },
  { id: "exam", label: "Exam simulator" },
  { id: "troubleshooting", label: "Scenario simulator" },
  { id: "review", label: "Review dashboard" },
];

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
}: SidebarProps) {
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Partial<Record<Domain, boolean>>>({});

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
    <aside className="ccna-desktop-sidebar" style={S.sidebar} aria-label="Workspace navigation">
      {/* Brand row */}
      <div style={S.brandRow}>
        <div style={S.brandMark}>C</div>
        <div style={S.brandText}>
          <p style={S.brandTitle}>CCNA workspace</p>
          <p style={S.brandSubtitle}>200-301 · practice lab</p>
        </div>
        <ThemeToggle />
      </div>

      <div style={S.searchRow}>
        <SearchIcon size={14} style={S.searchIcon} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search topics"
          style={S.search}
          aria-label="Search topics"
        />
      </div>

      <div style={S.scrollArea}>
        <div style={S.sectionLabel}>Topics</div>
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
                {DOMAIN_LABELS[domain]}
              </button>
              {!collapsed[domain] && (
                <div>
                  {topics.map((t) => {
                    const active = t === activeTopicId;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => onSelectTopic(t)}
                        aria-current={active ? "page" : undefined}
                        className="ccna-transition-all"
                        style={{ ...S.item, ...(active ? S.itemActive : null) }}
                      >
                        <span
                          style={{ ...S.dot, background: DOMAIN_DOT[domainOf(t)] }}
                          aria-hidden="true"
                        />
                        {t.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
          {groups.length === 0 && <div style={S.empty}>No topics match "{query}".</div>}
        </div>

        <div style={S.sectionLabel}>Engines</div>
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
    borderRight: "1px solid var(--border)",
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
  brandMark: {
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
  },
  brandText: { minWidth: 0, flex: 1 },
  brandTitle: { margin: 0, fontSize: 13, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  brandSubtitle: { margin: 0, fontSize: 10.5, color: "var(--text-muted)" },
  searchRow: { position: "relative", marginBottom: 16 },
  searchIcon: { position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" },
  search: {
    width: "100%",
    boxSizing: "border-box",
    padding: "7px 10px 7px 30px",
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
    textAlign: "left",
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
    textAlign: "left",
    padding: "7px 8px 7px 25px",
    fontSize: 13,
    fontWeight: 500,
    color: "var(--text-secondary)",
    background: "transparent",
    border: "none",
    borderLeft: "2px solid transparent",
    borderRadius: "0 var(--radius) var(--radius) 0",
    cursor: "pointer",
  },
  itemActive: {
    background: "var(--accent-bg)",
    color: "var(--accent-text)",
    fontWeight: 600,
    borderLeft: "2px solid var(--accent)",
  },
  dot: { width: 7, height: 7, borderRadius: "50%", flexShrink: 0 },
  empty: { padding: "8px", fontSize: 12.5, color: "var(--text-muted)" },
};
