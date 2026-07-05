// ui/pages/EngineComingSoon.tsx
// Exam, Troubleshooting, and Review engines are still locked Phase-E stubs
// (engines/*/index.ts throw "Not implemented" by design — see Phase C/D docs
// and DEPLOYMENT_CHECKLIST.md item 5). Rather than have the Sidebar link do
// nothing when clicked (the bug being fixed here), this page states plainly
// what's missing and why, instead of crashing or silently failing.

import React from "react";

export interface EngineComingSoonProps {
  engineName: string;
  reason: string;
}

export default function EngineComingSoon({ engineName, reason }: EngineComingSoonProps) {
  return (
    <div style={S.wrap}>
      <div style={S.badge}>Not implemented yet</div>
      <h1 style={S.title}>{engineName}</h1>
      <p style={S.body}>{reason}</p>
      <p style={S.muted}>
        This is a deliberate Phase E boundary, not a bug — see docs/PhaseC_Engine_Architecture.md
        for this engine's planned design and dependencies.
      </p>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  wrap: { padding: "60px 20px", textAlign: "center", fontFamily: "var(--font-ui, system-ui)" },
  badge: {
    display: "inline-block",
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    padding: "4px 12px",
    borderRadius: 999,
    background: "#FBF3DF",
    color: "#8a5c00",
    marginBottom: 16,
  },
  title: { fontSize: 24, margin: "0 0 12px", color: "var(--text-primary, #1A1A18)" },
  body: { fontSize: 15, color: "var(--text-secondary, #6B6B65)", maxWidth: 440, margin: "0 auto 12px", lineHeight: 1.6 },
  muted: { fontSize: 13, color: "var(--text-muted, #9C9B94)", maxWidth: 440, margin: "0 auto" },
};
