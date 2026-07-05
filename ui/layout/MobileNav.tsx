// ui/layout/MobileNav.tsx
// Floating glass pill nav for mobile (< 860px) — ported from the HLOS
// "learner" shell's MobileNav pattern at Ahmed's request: a centered fixed
// pill (brand orb · workspace identity · search · theme · ☰) that expands
// into a glass panel below itself with the full grouped nav, closing on
// selection or on outside tap. Rendered alongside <Sidebar/> in
// WorkspaceLayout; each is shown/hidden by the other via the
// .ccna-desktop-sidebar / .ccna-mobile-pill-nav CSS classes in tokens.css.

import React, { useEffect, useMemo, useState } from "react";
import { groupByDomain, DOMAIN_LABELS, domainOf, type Domain } from "./domains";
import { SearchIcon, MenuIcon, CloseIcon } from "../components/icons";
import ThemeToggle from "../components/ThemeToggle";

export interface MobileNavProps {
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

export default function MobileNav({
  topicIds,
  activeTopicId,
  onSelectTopic,
  activeEngine,
  onSelectEngine,
}: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Close whenever the active selection changes elsewhere.
  useEffect(() => setOpen(false), [activeTopicId, activeEngine]);

  const filtered = useMemo(
    () =>
      query.trim()
        ? topicIds.filter((t) => t.toLowerCase().includes(query.trim().toLowerCase()))
        : topicIds,
    [topicIds, query]
  );
  const groups = useMemo(() => groupByDomain(filtered), [filtered]);

  let i = 0;
  const nextDelay = () => `${Math.min(i++, 14) * 30}ms`;

  return (
    <div style={S.wrap} className="ccna-mobile-pill-nav">
      {/* Pill */}
      <div style={{ ...S.pill, ...(open ? S.pillOpen : null) }} className="ccna-glass">
        <span style={S.orb}>C</span>
        <div style={S.identity}>
          <p style={S.identityTitle}>CCNA workspace</p>
          <p style={S.identitySubtitle}>{activeEngine ?? activeTopicId.toUpperCase()}</p>
        </div>
        <button
          type="button"
          onClick={() => setSearchOpen((v) => !v)}
          aria-label="Search topics"
          style={S.iconBtn}
          className="ccna-press"
        >
          <SearchIcon size={15} />
        </button>
        <ThemeToggle style={{ width: 30, height: 30, borderRadius: 999, border: "none", background: "transparent" }} />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="ccna-mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          style={{ ...S.iconBtn, ...(open ? S.iconBtnActive : null) }}
          className="ccna-press"
        >
          {open ? <CloseIcon size={15} /> : <MenuIcon size={15} />}
        </button>
      </div>

      {searchOpen && !open && (
        <div style={S.searchBar} className="ccna-glass ccna-anim-fade-up">
          <SearchIcon size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search topics…"
            style={S.searchInput}
          />
        </div>
      )}

      {/* Backdrop — closes on outside tap */}
      {open && (
        <button aria-hidden tabIndex={-1} onClick={() => setOpen(false)} style={S.backdrop} />
      )}

      {/* Panel */}
      {open && (
        <nav id="ccna-mobile-menu" aria-label="Main navigation" style={S.panel} className="ccna-glass ccna-anim-fade-up">
          <p style={S.panelLabel}>Topics</p>
          <div style={S.panelList}>
            {groups.map(({ domain, topics }) => (
              <div key={domain} style={S.domainBlock}>
                <p style={S.domainLabel}>{DOMAIN_LABELS[domain]}</p>
                {topics.map((t) => {
                  const active = t === activeTopicId;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => onSelectTopic(t)}
                      className="ccna-stagger-item"
                      style={{
                        ...S.panelItem,
                        ...(active ? S.panelItemActive : null),
                        animationDelay: nextDelay(),
                      }}
                    >
                      <span style={{ ...S.dot, background: DOMAIN_DOT[domainOf(t)] }} />
                      {t.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <p style={S.panelLabel}>Engines</p>
          <div style={S.panelList}>
            {ENGINE_ITEMS.map((e) => {
              const active = e.id === activeEngine;
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => onSelectEngine?.(e.id)}
                  className="ccna-stagger-item"
                  style={{ ...S.panelItem, ...(active ? S.panelItemActive : null), animationDelay: nextDelay() }}
                >
                  {e.label}
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  wrap: { position: "fixed", left: "50%", top: 10, transform: "translateX(-50%)", zIndex: 50, width: "calc(100vw - 24px)", maxWidth: 420 },
  pill: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 8px 6px 12px",
    borderRadius: "var(--radius-pill)",
    transition: "box-shadow 0.2s ease",
  },
  pillOpen: { boxShadow: "0 10px 30px rgba(0,0,0,0.15)" },
  orb: {
    width: 30,
    height: 30,
    borderRadius: 10,
    background: "var(--accent)",
    color: "#fff",
    fontWeight: 700,
    fontSize: 13,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  identity: { minWidth: 0, flex: 1, lineHeight: 1.2 },
  identityTitle: { margin: 0, fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  identitySubtitle: { margin: 0, fontSize: 10, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 999,
    border: "none",
    background: "transparent",
    color: "var(--text-secondary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
  },
  iconBtnActive: { background: "var(--accent)", color: "#fff" },
  searchBar: {
    marginTop: 8,
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 14px",
    borderRadius: "var(--radius-pill)",
  },
  searchInput: { flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 13.5, color: "var(--text-primary)" },
  backdrop: { position: "fixed", inset: 0, zIndex: -1, background: "transparent", border: "none", cursor: "default" },
  panel: {
    marginTop: 8,
    maxHeight: "calc(100vh - 90px)",
    overflowY: "auto",
    borderRadius: 16,
    padding: 10,
  },
  panelLabel: { margin: 0, padding: "8px 10px 4px", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, color: "var(--text-muted)" },
  panelList: { display: "flex", flexDirection: "column", gap: 2, marginBottom: 4 },
  domainBlock: { marginBottom: 4 },
  domainLabel: { margin: "4px 0 2px 10px", fontSize: 10.5, fontWeight: 600, color: "var(--text-muted)" },
  panelItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    textAlign: "left",
    padding: "9px 10px",
    fontSize: 13.5,
    fontWeight: 500,
    color: "var(--text-secondary)",
    background: "transparent",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
  },
  panelItemActive: { background: "var(--accent-bg)", color: "var(--accent-text)", fontWeight: 600 },
  dot: { width: 7, height: 7, borderRadius: "50%", flexShrink: 0 },
};
