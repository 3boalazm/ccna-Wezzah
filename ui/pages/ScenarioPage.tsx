// ui/pages/ScenarioPage.tsx
// Scenario Simulator — now a 3-phase flow instead of one flat reveal card,
// mirroring HLOS's scenarios catalog → briefing → play → summary structure:
//   catalog  — light theme, same chrome as the rest of the app (a scenario
//              picker is "a learner page like any other" per HLOS's own
//              product decision — the cinematic treatment is reserved for
//              the run itself).
//   briefing — full-bleed dark gradient + glass panel (via onFocusChange),
//              numbered objectives, "Start scenario" CTA.
//   play     — same dark/glass treatment, step-dot progress, one
//              diagnostic step revealed at a time.
//   summary  — dark/glass debrief with the root cause reveal.
// The dark background is a fixed full-viewport layer behind the (still
// width-constrained) content, so it reads as full-bleed regardless of
// WorkspaceLayout's focus-mode padding.

import React, { useMemo, useState } from "react";
import * as troubleshootingEngine from "../../engines/troubleshooting-engine";
import { useLanguage } from "../i18n/LanguageContext";
import type { ScenarioTemplate } from "../../engines/knowledge-engine/types";

export interface ScenarioPageProps {
  onFocusChange?: (focused: boolean) => void;
}

type Phase = "catalog" | "briefing" | "play" | "summary";

export default function ScenarioPage({ onFocusChange }: ScenarioPageProps) {
  const { t, lang } = useLanguage();
  const scenarios = useMemo(() => troubleshootingEngine.listAvailableScenarios(lang), [lang]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("catalog");
  const [revealed, setRevealed] = useState(0);

  const active: ScenarioTemplate | null = activeId ? troubleshootingEngine.generateScenario(activeId, lang) : null;

  const openBriefing = (id: string) => {
    setActiveId(id);
    setRevealed(0);
    setPhase("briefing");
    onFocusChange?.(true);
  };

  const backToCatalog = () => {
    setPhase("catalog");
    setActiveId(null);
    onFocusChange?.(false);
  };

  const pickRandom = () => {
    const s = troubleshootingEngine.pickRandomScenario(Date.now(), lang);
    openBriefing(s.template_id);
  };

  if (scenarios.length === 0) {
    return (
      <div style={S.empty}>
        <strong>{t("scenario.noTemplates")}</strong>
        <p style={S.muted}>{t("scenario.noTemplatesBody")}</p>
      </div>
    );
  }

  // --- Phase: catalog (light theme, normal chrome) -----------------------
  if (phase === "catalog" || !active) {
    return (
      <div style={S.page} className="ccna-anim-fade-up">
        <header style={S.header}>
          <div style={S.badge}>{t("scenario.badge")}</div>
          <h1 style={S.title}>{t("scenario.title")}</h1>
          <p style={S.subtitle}>{t("scenario.subtitle")}</p>
        </header>
        <button style={S.randomBtn} className="ccna-hoverable ccna-press" onClick={pickRandom}>
          {t("scenario.surpriseMe")}
        </button>
        <div style={S.grid}>
          {scenarios.map((s) => (
            <button
              key={s.template_id}
              type="button"
              style={S.scenarioCard}
              className="ccna-hoverable ccna-press"
              onClick={() => openBriefing(s.template_id)}
            >
              <div style={S.chips} dir="ltr">
                {s.topics_involved.map((topicId) => (
                  <span key={topicId} style={S.chip}>
                    {topicId.toUpperCase()}
                  </span>
                ))}
              </div>
              <p style={S.scenarioText}>{s.symptom_text}</p>
              <span style={S.stepCount}>{t("scenario.diagnosticSteps", { n: s.expected_diagnostic_order.length })}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // --- Phase: briefing (dark/glass) ---------------------------------------
  if (phase === "briefing") {
    return (
      <div style={S.darkPage}>
        <div style={S.darkWrap}>
        <button onClick={backToCatalog} style={S.darkBack} className="ccna-press">
          {t("scenario.allScenarios")}
        </button>
        <div style={S.kicker}>{t("scenario.missionBriefing")}</div>
        <div style={S.chipsRow} dir="ltr">
          {active.topics_involved.map((topicId) => (
            <span key={topicId} style={S.darkChip}>
              {topicId.toUpperCase()}
            </span>
          ))}
        </div>
        <p style={S.darkLabel}>{t("scenario.situation")}</p>
        <p style={S.darkParagraph}>{active.symptom_text}</p>

        <div style={S.darkDivider} />

        <p style={S.darkLabel}>{t("scenario.diagnosticObjectives")}</p>
        <div style={{ marginBottom: 28 }}>
          {active.expected_diagnostic_order.map((_, i) => (
            <div key={i} style={S.objectiveRow}>
              <span style={S.objectiveNum}>{i + 1}</span>
              <p style={S.objectiveText}>{t("scenario.diagnosticStepPlaceholder", { n: i + 1 })}</p>
            </div>
          ))}
        </div>

        <button
          type="button"
          style={S.darkCta}
          className="ccna-hoverable ccna-press"
          onClick={() => setPhase("play")}
        >
          {t("scenario.startScenario")}
        </button>
        <span style={S.darkMeta}>{t("scenario.decisionsMeta", { n: active.expected_diagnostic_order.length })}</span>
        </div>
      </div>
    );
  }

  // --- Phase: play (dark/glass) --------------------------------------------
  if (phase === "play") {
    const allRevealed = revealed >= active.expected_diagnostic_order.length;
    return (
      <div style={S.darkPage}>
        <div style={S.darkWrap}>
        <div style={S.stepBar}>
          <span style={S.stepBarLabel}>
            {t("scenario.stepOf", { n: Math.min(revealed + 1, active.expected_diagnostic_order.length), total: active.expected_diagnostic_order.length })}
          </span>
          <div style={S.dotsRow}>
            {active.expected_diagnostic_order.map((_, i) => (
              <span key={i} style={{ ...S.stepDot, background: i < revealed ? "var(--accent)" : "rgba(255,255,255,0.18)" }} />
            ))}
          </div>
        </div>

        <div style={S.glassCard}>
          <p style={S.darkLabel}>{t("scenario.situation")}</p>
          <p style={S.darkParagraph}>{active.symptom_text}</p>
        </div>

        <p style={S.darkLabel}>{t("scenario.yourDiagnosticPath")}</p>
        <div style={{ marginBottom: 20 }}>
          {active.expected_diagnostic_order.slice(0, revealed).map((step, i) => (
            <div key={i} style={S.glassStep} className="ccna-anim-fade-up">
              <span style={S.glassStepNum}>{i + 1}</span>
              <p style={S.glassStepText}>{step}</p>
            </div>
          ))}
        </div>

        {!allRevealed ? (
          <button type="button" style={S.darkCta} className="ccna-hoverable ccna-press" onClick={() => setRevealed((r) => r + 1)}>
            {t("scenario.revealNextStep")}
          </button>
        ) : (
          <button type="button" style={S.darkCta} className="ccna-hoverable ccna-press" onClick={() => setPhase("summary")}>
            {t("scenario.continueToDebrief")}
          </button>
        )}
        </div>
      </div>
    );
  }

  // --- Phase: summary (dark/glass) -----------------------------------------
  return (
    <div style={S.darkPage}>
      <div style={S.darkWrap}>
      <div style={S.kicker}>{t("scenario.scenarioComplete")}</div>
      <div style={{ ...S.glassCard, textAlign: "center", padding: "32px 28px" }} className="ccna-anim-pop">
        <div style={S.summaryEmoji}>✅</div>
        <p style={S.summaryHeadline}>{t("scenario.stepsCompleted", { n: active.expected_diagnostic_order.length, total: active.expected_diagnostic_order.length })}</p>
        <p style={S.darkMeta} dir="ltr">{t("scenario.topicsLabel", { topics: active.topics_involved.map((topicId) => topicId.toUpperCase()).join(", ") })}</p>
      </div>

      <p style={S.darkLabel}>{t("scenario.rootCause")}</p>
      <div style={S.glassCard}>
        <p style={S.darkParagraph}>{active.hidden_root_cause}</p>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
        <button type="button" style={S.darkCtaOutline} className="ccna-hoverable ccna-press" onClick={() => { setRevealed(0); setPhase("play"); }}>
          {t("scenario.replayScenario")}
        </button>
        <button type="button" style={S.darkCta} className="ccna-hoverable ccna-press" onClick={backToCatalog}>
          {t("scenario.backToCatalog")}
        </button>
      </div>
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  // --- catalog (light) ---
  page: { fontFamily: "var(--font-ui)" },
  header: { marginBottom: 20 },
  badge: { display: "inline-block", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, padding: "5px 14px", borderRadius: 999, background: "var(--accent-bg)", color: "var(--accent-text)", marginBottom: 12 },
  title: { fontSize: 24, margin: "0 0 8px", color: "var(--text-primary)" },
  subtitle: { fontSize: 14.5, color: "var(--text-secondary)", lineHeight: 1.6, maxWidth: 560 },
  randomBtn: { padding: "9px 18px", borderRadius: 999, border: "1px solid var(--accent)", background: "var(--accent-bg)", color: "var(--accent-text)", fontSize: 13.5, fontWeight: 700, cursor: "pointer", marginBottom: 20 },
  grid: { display: "grid", gridTemplateColumns: "1fr", gap: 12 },
  scenarioCard: { textAlign: "start", padding: "16px 18px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--card-bg)", cursor: "pointer" },
  chips: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  chip: { background: "var(--accent-bg)", color: "var(--accent-text)", padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700 },
  scenarioText: { fontSize: 14.5, color: "var(--text-primary)", margin: "0 0 8px", lineHeight: 1.5 },
  stepCount: { fontSize: 12, color: "var(--text-muted)" },
  empty: { padding: "40px 20px", textAlign: "center" },
  muted: { color: "var(--text-muted)", fontSize: 13.5 },

  // --- dark/glass (briefing, play, summary) ---
  // Full-bleed via negative margins that exactly cancel WorkspaceLayout's
  // focus-mode padding (60px top/bottom, 20px sides — see
  // ui/layout/WorkspaceLayout.tsx's `focusContent` style), rather than
  // position:fixed + negative z-index (which would paint *behind* the
  // shell's own opaque background and never actually be visible).
  darkPage: {
    margin: "-60px -20px",
    padding: "48px 20px 60px",
    minHeight: "calc(100vh - 1px)",
    background: "linear-gradient(180deg, #16242F 0%, #1E1B2E 100%)",
  },
  darkWrap: { maxWidth: 640, margin: "0 auto", color: "rgba(255,255,255,0.9)", fontFamily: "var(--font-ui)" },
  darkBack: { display: "inline-flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.55)", background: "none", border: "none", cursor: "pointer", fontSize: 13, marginBottom: 20, padding: 0 },
  kicker: { fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(127,119,221,0.8)", marginBottom: 16, fontFamily: "var(--font-mono)" },
  chipsRow: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18 },
  darkChip: { background: "rgba(15,107,107,0.22)", border: "1px solid rgba(15,107,107,0.4)", color: "#4FB3A3", padding: "3px 11px", borderRadius: 999, fontSize: 11, fontWeight: 700 },
  darkLabel: { fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 10, fontFamily: "var(--font-mono)" },
  darkParagraph: { fontSize: 15.5, color: "rgba(255,255,255,0.85)", lineHeight: 1.75, marginBottom: 4 },
  darkDivider: { borderTop: "1px solid rgba(255,255,255,0.1)", margin: "22px 0" },
  darkMeta: { fontSize: 12.5, color: "rgba(255,255,255,0.4)", display: "block", marginTop: 10 },
  objectiveRow: { display: "flex", gap: 10, marginBottom: 10 },
  objectiveNum: { width: 20, height: 20, borderRadius: "50%", background: "rgba(15,107,107,0.3)", border: "1px solid rgba(15,107,107,0.5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#4FB3A3", flexShrink: 0, marginTop: 1, fontFamily: "var(--font-mono)" },
  objectiveText: { fontSize: 13.5, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, margin: 0 },
  darkCta: { height: 46, padding: "0 30px", background: "#0F6B6B", color: "#fff", border: "none", borderRadius: 11, fontSize: 14.5, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 18px rgba(15,107,107,0.4)" },
  darkCtaOutline: { height: 46, padding: "0 24px", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 11, fontSize: 13.5, fontWeight: 600, cursor: "pointer" },
  stepBar: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 8 },
  stepBarLabel: { fontSize: 12.5, color: "rgba(255,255,255,0.55)", fontFamily: "var(--font-mono)" },
  dotsRow: { display: "flex", gap: 8 },
  stepDot: { width: 8, height: 8, borderRadius: "50%", display: "inline-block" },
  glassCard: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "20px 22px", marginBottom: 18 },
  glassStep: { display: "flex", gap: 10, background: "rgba(127,119,221,0.08)", border: "1px solid rgba(127,119,221,0.22)", borderRadius: 10, padding: "12px 14px", marginBottom: 8 },
  glassStepNum: { width: 20, height: 20, borderRadius: "50%", background: "rgba(127,119,221,0.25)", color: "rgba(220,215,250,0.95)", fontSize: 10.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "var(--font-mono)" },
  glassStepText: { fontSize: 13.5, color: "rgba(255,255,255,0.85)", lineHeight: 1.6, margin: 0 },
  summaryEmoji: { fontSize: 32, marginBottom: 8 },
  summaryHeadline: { fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.92)", margin: "0 0 6px" },
};
