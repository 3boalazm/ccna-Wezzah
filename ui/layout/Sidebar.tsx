// ui/layout/Sidebar.tsx
// AppFlowy-inspired sidebar: workspace header + search, then a collapsible
// tree. Two top-level sections instead of AppFlowy's "Shared/Private/Trash":
//   1. Topics — grouped by network domain, each item colored by its
//      domain (see domains.ts) instead of a random emoji icon.
//   2. Engines — direct links to Question Bank / Exam / Troubleshooting /
//      Review, matching the pages already defined in Phase D's folder plan.

import React, { useMemo, useState } from "react";
import { groupByDomain, DOMAIN_LABELS, domainOf, type Domain } from "./domains";

export interface SidebarProps {
  topicIds: string[];
  activeTopicId: string;
  onSelectTopic: (topicId: string) => void;
  activeEngine?: string;
  onSelectEngine?: (engineId: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
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
  isOpen = true,
  onClose,
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
    <nav
      style={S.sidebar}
      className="ccna-sidebar"
      data-open={isOpen}
      aria-label="Workspace navigation"
      aria-hidden={!isOpen}
    >
      <div style={S.header}>
        <span style={S.workspaceName}>CCNA workspace</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close navigation"
          style={S.closeBtn}
          className="ccna-hamburger-btn ccna-press"
        >
          ✕
        </button>
      </div>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search topics"
        style={S.search}
        aria-label="Search topics"
      />

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
                {topics.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      onSelectTopic(t);
                      onClose?.();
                    }}
                    aria-current={t === activeTopicId ? "page" : undefined}
                    className="ccna-transition-all"
                    style={{
                      ...S.item,
                      ...(t === activeTopicId ? S.itemActive : null),
                    }}
                  >
                    <span
                      style={{ ...S.dot, background: DOMAIN_DOT[domainOf(t)] }}
                      aria-hidden="true"
                    />
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {groups.length === 0 && <div style={S.empty}>No topics match "{query}".</div>}
      </div>

      <div style={S.sectionLabel}>Engines</div>
      <div style={S.tree}>
        {ENGINE_ITEMS.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => {
              onSelectEngine?.(e.id);
              onClose?.();
            }}
            aria-current={e.id === activeEngine ? "page" : undefined}
            className="ccna-transition-all"
            style={{
              ...S.item,
              ...(e.id === activeEngine ? S.itemActive : null),
            }}
          >
            {e.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

const S: Record<string, React.CSSProperties> = {
  sidebar: {
    width: "var(--sidebar-width)",
    minWidth: "var(--sidebar-width)",
    background: "var(--sidebar-bg)",
    borderRight: "1px solid var(--border)",
    height: "100vh",
    overflowY: "auto",
    padding: "16px 12px",
    fontFamily: "var(--font-ui)",
    boxSizing: "border-box",
  },
  header: { padding: "4px 8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  workspaceName: { fontWeight: 600, fontSize: 14, color: "var(--text-primary)" },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "var(--card-bg)",
    color: "var(--text-secondary)",
    fontSize: 13,
    cursor: "pointer",
    alignItems: "center",
    justifyContent: "center",
  },
  search: {
    width: "100%",
    boxSizing: "border-box",
    padding: "7px 10px",
    fontSize: 13,
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    background: "var(--card-bg)",
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "var(--text-muted)",
    padding: "12px 8px 6px",
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
    padding: "6px 8px 6px 26px",
    fontSize: 13,
    color: "var(--text-primary)",
    background: "transparent",
    border: "none",
    borderRadius: "var(--radius)",
    cursor: "pointer",
  },
  itemActive: { background: "var(--accent-bg)", color: "var(--accent-text)", fontWeight: 600 },
  dot: { width: 7, height: 7, borderRadius: "50%", flexShrink: 0 },
  empty: { padding: "8px", fontSize: 12.5, color: "var(--text-muted)" },
};
