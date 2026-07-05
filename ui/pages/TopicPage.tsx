// ui/pages/TopicPage.tsx
// Renders ONE topic through the full chain:
//   /knowledge/*.json (+ Arabic overlay) -> Knowledge Engine -> useKnowledge -> UI
// Fully bilingual: chrome (tabs, section titles, badges) goes through
// t(); narrative content comes from useLocalizedTopic() which merges the
// English base module with the Arabic translation overlay when lang="ar".
// Literal CLI commands/code always render dir="ltr" regardless of UI
// language — command syntax is a technical term, never translated or
// bidi-reordered.

import React, { useEffect, useState } from "react";
import { useLocalizedTopic } from "../../state/useKnowledge";
import { useLanguage } from "../i18n/LanguageContext";
import type {
  CommandExample,
  CliExample,
  TroubleshootingNote,
  Difficulty,
  Completeness,
} from "../../engines/knowledge-engine/types";

type TabId = "overview" | "commands" | "troubleshooting" | "examprep" | "related";

const TAB_IDS: TabId[] = ["overview", "commands", "troubleshooting", "examprep", "related"];

export default function TopicPage({ initialTopic = "nat" }: { initialTopic?: string }) {
  const topicId = initialTopic;
  const { t, lang } = useLanguage();
  const { topic, error } = useLocalizedTopic(topicId, lang);
  const [tab, setTab] = useState<TabId>("overview");

  useEffect(() => setTab("overview"), [topicId]);

  return (
    <div style={S.page}>
      {error && (
        <div style={S.error}>
          <strong>{t("topicPage.failedToLoad", { topic: topicId })}</strong> {error.message}
          <div style={S.muted}>{t("topicPage.loadHint")}</div>
        </div>
      )}

      {!error && !topic && <div style={S.muted}>{t("topicPage.loading", { topic: topicId })}</div>}

      {topic && (
        <article key={topicId + lang} className="ccna-anim-fade-up">
          <nav style={S.breadcrumb}>{topic.path.join("  ›  ")}</nav>
          <header style={S.header}>
            <h1 style={S.h1}>{topic.topic_id.toUpperCase()}</h1>
            <div style={S.badges}>
              <DifficultyBadge value={topic.difficulty} />
              <CompletenessBadge value={topic.completeness} />
            </div>
          </header>

          <p style={S.overview}>{topic.overview}</p>

          {/* Quick facts — scannable without switching tabs */}
          <div style={S.factsRow}>
            <FactChip label={t("topicPage.facts.updated")} value={topic.last_updated} />
            <FactChip label={t("topicPage.facts.commands")} value={String(topic.config_commands.length + topic.verification_commands.length)} />
            <FactChip label={t("topicPage.facts.traps")} value={String(topic.exam_traps.length)} />
            <FactChip label={t("topicPage.facts.related")} value={String(topic.related_topics.length)} />
            {topic.gaps.length > 0 && <FactChip label={t("topicPage.facts.gaps")} value={String(topic.gaps.length)} warn />}
          </div>

          {topic.gaps.length > 0 && (
            <div style={S.gapsBanner}>
              <strong>{t("topicPage.contentGaps")}</strong> {t("topicPage.gapsExplain")} {topic.gaps.join(", ")}
            </div>
          )}

          {/* Tab bar */}
          <div style={S.tabBar} role="tablist">
            {TAB_IDS.map((id) => (
              <button
                key={id}
                role="tab"
                type="button"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className="ccna-transition-all"
                style={{ ...S.tab, ...(tab === id ? S.tabActive : null) }}
              >
                {t(`topicPage.tabs.${id}`)}
              </button>
            ))}
          </div>

          <div key={tab} className="ccna-anim-fade-up">
            {tab === "overview" && (
              <>
                <Section title={t("topicPage.sections.definitions")} gapped={isGap(topic.gaps, "definitions")}>
                  <StringList items={topic.definitions} />
                </Section>
                <Section title={t("topicPage.sections.coreConcepts")} gapped={isGap(topic.gaps, "core_concepts")}>
                  <StringList items={topic.core_concepts} />
                </Section>
                <Section title={t("topicPage.sections.protocolOperation")} gapped={isGap(topic.gaps, "protocol_operation")}>
                  <StringList items={topic.protocol_operation} />
                </Section>
                <Section title={t("topicPage.sections.packetFlow")} gapped={isGap(topic.gaps, "packet_flow")}>
                  <p style={S.mono}>{topic.packet_flow || t("topicPage.none")}</p>
                </Section>
              </>
            )}

            {tab === "commands" && (
              <>
                <Section title={t("topicPage.sections.configCommands")} gapped={isGap(topic.gaps, "config_commands")}>
                  <CommandTable items={topic.config_commands} noneLabel={t("topicPage.none")} />
                </Section>
                <Section title={t("topicPage.sections.verificationCommands")} gapped={isGap(topic.gaps, "verification_commands")}>
                  <CommandTable items={topic.verification_commands} noneLabel={t("topicPage.none")} />
                </Section>
                <Section title={t("topicPage.sections.configExamples")} gapped={isGap(topic.gaps, "config_examples")}>
                  <CliBlocks items={topic.config_examples} noneLabel={t("topicPage.none")} />
                </Section>
                <Section title={t("topicPage.sections.cliExamples")} gapped={isGap(topic.gaps, "cli_examples")}>
                  <CliBlocks items={topic.cli_examples} noneLabel={t("topicPage.none")} />
                </Section>
              </>
            )}

            {tab === "troubleshooting" && (
              <>
                <Section title={t("topicPage.sections.troubleshooting")} gapped={isGap(topic.gaps, "troubleshooting")}>
                  <TroubleshootingList items={topic.troubleshooting} noneLabel={t("topicPage.none")} labels={{ symptom: t("topicPage.symptom"), cause: t("topicPage.cause"), fix: t("topicPage.fix") }} />
                </Section>
                <Section title={t("topicPage.sections.securityNotes")} gapped={isGap(topic.gaps, "security_notes")}>
                  <StringList items={topic.security_notes} noneLabel={t("topicPage.none")} />
                </Section>
                <Section title={t("topicPage.sections.examTraps")} gapped={isGap(topic.gaps, "exam_traps")}>
                  <StringList items={topic.exam_traps} noneLabel={t("topicPage.none")} />
                </Section>
              </>
            )}

            {tab === "examprep" && (
              <>
                <Section title={t("topicPage.sections.interviewQuestions")} gapped={isGap(topic.gaps, "interview_questions")}>
                  <StringList items={topic.interview_questions} noneLabel={t("topicPage.none")} />
                </Section>
                <Section title={t("topicPage.sections.bestPractices")} gapped={isGap(topic.gaps, "best_practices")}>
                  <StringList items={topic.best_practices} noneLabel={t("topicPage.none")} />
                </Section>
                <Section title={t("topicPage.sections.enterpriseNotes")} gapped={isGap(topic.gaps, "enterprise_notes")}>
                  <StringList items={topic.enterprise_notes} noneLabel={t("topicPage.none")} />
                </Section>
              </>
            )}

            {tab === "related" && (
              <>
                <Section title={t("topicPage.sections.relatedTopics")} gapped={isGap(topic.gaps, "related_topics")}>
                  <div style={S.chips} dir="ltr">
                    {topic.related_topics.map((r) => (
                      <span key={r} style={S.chip}>{r}</span>
                    ))}
                    {topic.related_topics.length === 0 && <p style={S.muted}>{t("topicPage.none")}</p>}
                  </div>
                </Section>
                <Section title={t("topicPage.sections.keywords")}>
                  <div style={S.chips} dir="ltr">
                    {topic.keywords.map((k) => (
                      <span key={k} style={S.chipMuted}>{k}</span>
                    ))}
                  </div>
                </Section>
                <Section title={t("topicPage.sections.tags")}>
                  <div style={S.chips} dir="ltr">
                    {topic.tags.map((tg) => (
                      <span key={tg} style={S.chipMuted}>{tg}</span>
                    ))}
                  </div>
                </Section>
              </>
            )}
          </div>

          <footer style={S.footer}>
            {t("topicPage.source")} <span dir="ltr">{topic.source_docs.join(", ")}</span>
          </footer>
        </article>
      )}
    </div>
  );
}

// --- small presentational helpers ------------------------------------------

const isGap = (gaps: string[], field: string) => gaps.includes(field);

function FactChip({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <span style={{ ...S.factChip, ...(warn ? S.factChipWarn : null) }}>
      <span style={S.factChipLabel}>{label}</span> {value}
    </span>
  );
}

function Section({
  title,
  gapped,
  children,
}: {
  title: string;
  gapped?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section style={S.section}>
      <h2 style={S.h2}>
        {title}
        {gapped && <span style={S.gapTag}>gap</span>}
      </h2>
      {children}
    </section>
  );
}

function StringList({ items, noneLabel }: { items: string[]; noneLabel?: string }) {
  if (!items || items.length === 0) return <p style={S.muted}>{noneLabel ?? "—"}</p>;
  return (
    <ul style={S.ul}>
      {items.map((t, i) => (
        <li key={i} style={S.li}>{t}</li>
      ))}
    </ul>
  );
}

function CommandTable({ items, noneLabel }: { items: CommandExample[]; noneLabel?: string }) {
  if (!items || items.length === 0) return <p style={S.muted}>{noneLabel ?? "—"}</p>;
  return (
    <div style={S.scrollX}>
      <table style={S.table}>
        <tbody>
          {items.map((c, i) => (
            <tr key={i}>
              <td style={S.cmdCell}><code style={S.code} dir="ltr">{c.command}</code></td>
              <td style={S.purposeCell}>{c.purpose}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CliBlocks({ items, noneLabel }: { items: CliExample[]; noneLabel?: string }) {
  if (!items || items.length === 0) return <p style={S.muted}>{noneLabel ?? "—"}</p>;
  return (
    <>
      {items.map((ex, i) => (
        <div key={i} style={S.cliBlock}>
          <div style={S.cliTitle}>{ex.title}</div>
          <pre style={S.pre} dir="ltr">{ex.code}</pre>
          {ex.explanation && <div style={S.muted}>{ex.explanation}</div>}
        </div>
      ))}
    </>
  );
}

function TroubleshootingList({
  items,
  noneLabel,
  labels,
}: {
  items: TroubleshootingNote[];
  noneLabel?: string;
  labels: { symptom: string; cause: string; fix: string };
}) {
  if (!items || items.length === 0) return <p style={S.muted}>{noneLabel ?? "—"}</p>;
  return (
    <div>
      {items.map((t, i) => (
        <div key={i} style={S.tsNote}>
          <div><strong style={S.tsSymptom}>{labels.symptom}</strong> {t.symptom}</div>
          <div><strong style={S.tsCause}>{labels.cause}</strong> {t.cause}</div>
          <div><strong style={S.tsFix}>{labels.fix}</strong> {t.fix}</div>
        </div>
      ))}
    </div>
  );
}

function DifficultyBadge({ value }: { value: Difficulty }) {
  const { t } = useLanguage();
  const color =
    value === "Hard" ? "var(--difficulty-hard)" : value === "Medium" ? "var(--difficulty-medium)" : "var(--difficulty-easy)";
  return <span style={{ ...S.badge, background: color }}>{t(`common.difficulty.${value}`)}</span>;
}

function CompletenessBadge({ value }: { value: Completeness }) {
  const color =
    value === "high" ? "var(--difficulty-easy)" : value === "partial" ? "var(--difficulty-medium)" : "var(--difficulty-hard)";
  return <span style={{ ...S.badge, background: color }}>{value}</span>;
}

// --- inline styles (self-contained, no CSS deps) ---------------------------

const S: Record<string, React.CSSProperties> = {
  page: { padding: "24px 0 0", fontFamily: "var(--font-ui, system-ui), -apple-system, Segoe UI, Roboto, sans-serif", color: "var(--text-primary)", lineHeight: 1.5 },
  breadcrumb: { fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 },
  h1: { margin: 0, fontSize: 30, letterSpacing: 0.5 },
  badges: { display: "flex", gap: 8, alignItems: "center" },
  badge: { color: "#fff", padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700 },
  overview: { fontSize: 15.5, color: "var(--text-secondary)", marginTop: 10, marginBottom: 16, lineHeight: 1.7 },
  factsRow: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  factChip: { fontSize: 12, padding: "5px 11px", borderRadius: 999, background: "var(--hover-bg)", color: "var(--text-secondary)" },
  factChipWarn: { background: "var(--warning-bg)", color: "var(--warning)" },
  factChipLabel: { fontWeight: 700, color: "var(--text-muted)" },
  gapsBanner: { background: "var(--warning-bg)", border: "1px solid var(--warning)", borderRadius: "var(--radius)", padding: "8px 12px", fontSize: 13, color: "var(--warning)", margin: "0 0 16px" },
  tabBar: { display: "flex", gap: 4, borderBottom: "2px solid var(--border)", marginBottom: 20, overflowX: "auto" },
  tab: { padding: "9px 14px", border: "none", borderBottom: "2px solid transparent", marginBottom: -2, background: "transparent", cursor: "pointer", fontSize: 13.5, fontWeight: 600, color: "var(--text-secondary)", whiteSpace: "nowrap" },
  tabActive: { color: "var(--accent-text)", borderBottomColor: "var(--accent)" },
  section: { marginBottom: 24 },
  h2: { fontSize: 16, margin: "0 0 8px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 },
  gapTag: { fontSize: 10, fontWeight: 700, textTransform: "uppercase", background: "var(--hover-bg)", color: "var(--text-secondary)", padding: "2px 6px", borderRadius: 4 },
  ul: { margin: 0, paddingInlineStart: 20 },
  li: { marginBottom: 6, lineHeight: 1.7 },
  scrollX: { overflowX: "auto", maxWidth: "100%" },
  table: { borderCollapse: "collapse", width: "100%" },
  cmdCell: { padding: "6px 10px 6px 0", verticalAlign: "top", whiteSpace: "nowrap" },
  purposeCell: { padding: "6px 0", verticalAlign: "top", color: "var(--text-secondary)", fontSize: 14 },
  code: { background: "var(--hover-bg)", padding: "2px 6px", borderRadius: 4, fontSize: 13, fontFamily: "var(--font-mono)", color: "var(--danger)" },
  mono: { fontFamily: "var(--font-mono)", fontSize: 13, background: "var(--hover-bg)", padding: 12, borderRadius: "var(--radius)", whiteSpace: "pre-wrap", lineHeight: 1.8 },
  cliBlock: { marginBottom: 14 },
  cliTitle: { fontWeight: 600, fontSize: 14, marginBottom: 4 },
  pre: { background: "#1e1e1e", color: "#e6e6e6", padding: 12, borderRadius: "var(--radius)", overflowX: "auto", fontSize: 13, margin: "0 0 4px", textAlign: "left" },
  tsNote: { borderInlineStart: "3px solid var(--accent)", paddingInlineStart: 12, marginBottom: 14, fontSize: 14, lineHeight: 1.7 },
  tsSymptom: { color: "var(--danger)" },
  tsCause: { color: "var(--warning)" },
  tsFix: { color: "var(--difficulty-easy)" },
  chips: { display: "flex", flexWrap: "wrap", gap: 6 },
  chip: { background: "var(--accent-bg)", color: "var(--accent-text)", padding: "3px 10px", borderRadius: 999, fontSize: 13, fontWeight: 600 },
  chipMuted: { background: "var(--hover-bg)", color: "var(--text-secondary)", padding: "3px 10px", borderRadius: 999, fontSize: 12.5 },
  muted: { color: "var(--text-secondary)", fontSize: 13 },
  error: { background: "var(--danger-bg)", border: "1px solid var(--danger)", borderRadius: "var(--radius)", padding: "12px 14px", color: "var(--danger)", marginBottom: 16 },
  footer: { marginTop: 32, paddingTop: 12, borderTop: "1px solid var(--border)", fontSize: 12, color: "var(--text-muted)" },
};
