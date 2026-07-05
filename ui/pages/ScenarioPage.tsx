// ui/pages/ScenarioPage.tsx
// Scenario Simulator — picks from the pre-defined troubleshooting templates
// (engines/troubleshooting-engine/scenario-templates/*.json) and walks the
// learner through the diagnostic steps one reveal at a time, ending with
// the hidden root cause. Mirrors how the source material's own worked
// "troubleshooting challenge" sections are structured.

import React, { useMemo, useState } from "react";
import * as troubleshootingEngine from "../../engines/troubleshooting-engine";
import type { ScenarioTemplate } from "../../engines/knowledge-engine/types";

export default function ScenarioPage() {
  const scenarios = useMemo(() => troubleshootingEngine.listAvailableScenarios(), []);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(0);
  const [rootCauseShown, setRootCauseShown] = useState(false);

  const active: ScenarioTemplate | null = activeId
    ? troubleshootingEngine.generateScenario(activeId)
    : null;

  const pick = (id: string) => {
    setActiveId(id);
    setRevealed(0);
    setRootCauseShown(false);
  };

  const pickRandom = () => {
    const s = troubleshootingEngine.pickRandomScenario(Date.now());
    pick(s.template_id);
  };

  if (scenarios.length === 0) {
    return (
      <div style={S.empty}>
        <strong>No scenario templates found.</strong>
        <p style={S.muted}>
          Add JSON files under engines/troubleshooting-engine/scenario-templates/ to populate this
          page.
        </p>
      </div>
    );
  }

  if (!active) {
    return (
      <div style={S.page} className="ccna-anim-fade-up">
        <header style={S.header}>
          <div style={S.badge}>🧩 Scenario simulator</div>
          <h1 style={S.title}>Multi-topic troubleshooting scenarios</h1>
          <p style={S.subtitle}>
            Real diagnostic chains pulled straight from the source material's own worked examples.
            Pick one below, or let the simulator choose.
          </p>
        </header>
        <button style={S.randomBtn} className="ccna-hoverable ccna-press" onClick={pickRandom}>
          🎲 Surprise me
        </button>
        <div style={S.grid}>
          {scenarios.map((s) => (
            <button
              key={s.template_id}
              type="button"
              style={S.scenarioCard}
              className="ccna-hoverable ccna-press"
              onClick={() => pick(s.template_id)}
            >
              <div style={S.chips}>
                {s.topics_involved.map((t) => (
                  <span key={t} style={S.chip}>
                    {t.toUpperCase()}
                  </span>
                ))}
              </div>
              <p style={S.scenarioText}>{s.symptom_text}</p>
              <span style={S.stepCount}>{s.expected_diagnostic_order.length} diagnostic steps</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const allRevealed = revealed >= active.expected_diagnostic_order.length;

  return (
    <div style={S.page}>
      <button style={S.backBtn} className="ccna-hoverable ccna-press" onClick={() => setActiveId(null)}>
        ← All scenarios
      </button>

      <div style={S.card} className="ccna-anim-fade-up">
        <div style={S.chips}>
          {active.topics_involved.map((t) => (
            <span key={t} style={S.chip}>
              {t.toUpperCase()}
            </span>
          ))}
        </div>
        <h2 style={S.symptomTitle}>Symptom</h2>
        <p style={S.symptomText}>{active.symptom_text}</p>

        <h2 style={S.stepsTitle}>Your diagnostic path</h2>
        <ol style={S.stepsList}>
          {active.expected_diagnostic_order.slice(0, revealed).map((step, i) => (
            <li key={i} style={S.step} className="ccna-anim-fade-up">
              {step}
            </li>
          ))}
        </ol>

        {!allRevealed && (
          <button
            style={S.revealBtn}
            className="ccna-hoverable ccna-press"
            onClick={() => setRevealed((r) => r + 1)}
          >
            Reveal next diagnostic step ({revealed}/{active.expected_diagnostic_order.length})
          </button>
        )}

        {allRevealed && !rootCauseShown && (
          <button
            style={S.rootBtn}
            className="ccna-hoverable ccna-press"
            onClick={() => setRootCauseShown(true)}
          >
            Reveal hidden root cause
          </button>
        )}

        {rootCauseShown && (
          <div style={S.rootBox} className="ccna-anim-pop">
            <strong>Root cause:</strong> {active.hidden_root_cause}
          </div>
        )}
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: { fontFamily: "var(--font-ui)" },
  header: { marginBottom: 20 },
  badge: { display: "inline-block", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, padding: "5px 14px", borderRadius: 999, background: "var(--accent-bg, #EEECFC)", color: "var(--accent-text, #4B3FB0)", marginBottom: 12 },
  title: { fontSize: 24, margin: "0 0 8px", color: "var(--text-primary)" },
  subtitle: { fontSize: 14.5, color: "var(--text-secondary)", lineHeight: 1.6, maxWidth: 560 },
  randomBtn: { padding: "9px 18px", borderRadius: 999, border: "1px solid var(--accent, #6C5CE7)", background: "var(--accent-bg, #EEECFC)", color: "var(--accent-text, #4B3FB0)", fontSize: 13.5, fontWeight: 700, cursor: "pointer", marginBottom: 20 },
  grid: { display: "grid", gridTemplateColumns: "1fr", gap: 12 },
  scenarioCard: { textAlign: "left", padding: "16px 18px", borderRadius: 12, border: "1px solid var(--border, #E3E2DC)", background: "var(--card-bg)", cursor: "pointer" },
  chips: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  chip: { background: "var(--accent-bg, #EEECFC)", color: "var(--accent-text, #4B3FB0)", padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700 },
  scenarioText: { fontSize: 14.5, color: "var(--text-primary)", margin: "0 0 8px", lineHeight: 1.5 },
  stepCount: { fontSize: 12, color: "var(--text-muted)" },
  backBtn: { padding: "6px 14px", border: "1px solid var(--border, #E3E2DC)", borderRadius: 999, background: "var(--card-bg)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", marginBottom: 16 },
  card: { background: "var(--card-bg)", border: "1px solid var(--border, #E3E2DC)", borderRadius: 12, padding: "22px 24px" },
  symptomTitle: { fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--text-muted)", margin: "0 0 6px" },
  symptomText: { fontSize: 16, lineHeight: 1.6, color: "var(--text-primary)", margin: "0 0 20px" },
  stepsTitle: { fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--text-muted)", margin: "0 0 8px" },
  stepsList: { margin: "0 0 16px", paddingLeft: 20 },
  step: { marginBottom: 10, fontSize: 14.5, lineHeight: 1.5, color: "var(--text-primary)" },
  revealBtn: { padding: "10px 18px", borderRadius: 8, border: "1px solid var(--accent, #6C5CE7)", background: "var(--accent-bg, #EEECFC)", color: "var(--accent-text, #4B3FB0)", fontSize: 13.5, fontWeight: 700, cursor: "pointer" },
  rootBtn: { padding: "10px 18px", borderRadius: 8, border: "1px solid #C0392B", background: "#FBEAE8", color: "#7a1f1f", fontSize: 13.5, fontWeight: 700, cursor: "pointer" },
  rootBox: { marginTop: 14, padding: "14px 16px", background: "#FFF8E1", borderLeft: "3px solid #B8860B", borderRadius: "0 8px 8px 0", fontSize: 14.5, color: "#5c4400", lineHeight: 1.6 },
  empty: { padding: "40px 20px", textAlign: "center" },
  muted: { color: "var(--text-muted)", fontSize: 13.5 },
};
