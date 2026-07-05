// ui/pages/TopicPage.tsx
// Minimal page that renders ONE real topic through the full chain:
//   /knowledge/*.json -> loader (cache) -> Knowledge Engine -> useKnowledge -> UI
// Purpose (Phase E step 5): visually confirm the data pipeline works end-to-end.
// The knowledge base must be loaded before this mounts — the app entry point
// (main.tsx) awaits knowledgeEngine.init() first, so useKnowledge resolves
// synchronously from the in-memory cache.

import React from "react";
import { useKnowledge } from "../../state/useKnowledge";
import type {
  CommandExample,
  CliExample,
  TroubleshootingNote,
  Difficulty,
  Completeness,
} from "../../engines/knowledge-engine/types";

// Topic selection now lives in ONE place: the Sidebar (ui/layout/Sidebar.tsx),
// the single source of truth for "which topic is active." TopicPage is a
// controlled, presentation-only component — it renders whatever topicId it's
// given and has no switcher of its own, avoiding two conflicting sources of
// navigation state.
export default function TopicPage({ initialTopic = "nat" }: { initialTopic?: string }) {
  const topicId = initialTopic;
  const { topic, error } = useKnowledge(topicId);

  return (
    <div style={S.page}>
      {error && (
        <div style={S.error}>
          <strong>Failed to load "{topicId}".</strong> {error.message}
          <div style={S.muted}>
            (Is the knowledge base loaded? main.tsx must await knowledgeEngine.init()
            before rendering.)
          </div>
        </div>
      )}

      {!error && !topic && <div style={S.muted}>Loading "{topicId}"…</div>}

      {topic && (
        <article>
          <nav style={S.breadcrumb}>{topic.path.join("  ›  ")}</nav>
          <header style={S.header}>
            <h1 style={S.h1}>{topic.topic_id.toUpperCase()}</h1>
            <div style={S.badges}>
              <DifficultyBadge value={topic.difficulty} />
              <CompletenessBadge value={topic.completeness} />
              <span style={S.metaBadge}>updated {topic.last_updated}</span>
            </div>
          </header>

          <p style={S.overview}>{topic.overview}</p>

          {topic.gaps.length > 0 && (
            <div style={S.gapsBanner}>
              <strong>Content gaps</strong> (fields with no source content yet):{" "}
              {topic.gaps.join(", ")}
            </div>
          )}

          <Section title="Definitions" gapped={isGap(topic.gaps, "definitions")}>
            <StringList items={topic.definitions} />
          </Section>

          <Section title="Core Concepts" gapped={isGap(topic.gaps, "core_concepts")}>
            <StringList items={topic.core_concepts} />
          </Section>

          <Section title="Protocol Operation" gapped={isGap(topic.gaps, "protocol_operation")}>
            <StringList items={topic.protocol_operation} />
          </Section>

          <Section title="Packet Flow" gapped={isGap(topic.gaps, "packet_flow")}>
            <p style={S.mono}>{topic.packet_flow || "— none —"}</p>
          </Section>

          <Section title="Configuration Commands" gapped={isGap(topic.gaps, "config_commands")}>
            <CommandTable items={topic.config_commands} />
          </Section>

          <Section title="Verification Commands" gapped={isGap(topic.gaps, "verification_commands")}>
            <CommandTable items={topic.verification_commands} />
          </Section>

          <Section title="Config Examples" gapped={isGap(topic.gaps, "config_examples")}>
            <CliBlocks items={topic.config_examples} />
          </Section>

          <Section title="Troubleshooting" gapped={isGap(topic.gaps, "troubleshooting")}>
            <TroubleshootingList items={topic.troubleshooting} />
          </Section>

          <Section title="Exam Traps" gapped={isGap(topic.gaps, "exam_traps")}>
            <StringList items={topic.exam_traps} />
          </Section>

          <Section title="Interview Questions" gapped={isGap(topic.gaps, "interview_questions")}>
            <StringList items={topic.interview_questions} />
          </Section>

          <Section title="Related Topics" gapped={isGap(topic.gaps, "related_topics")}>
            <div style={S.chips}>
              {topic.related_topics.map((r) => (
                <span key={r} style={S.chip}>{r}</span>
              ))}
            </div>
          </Section>

          <footer style={S.footer}>
            Source: {topic.source_docs.join(", ")}
          </footer>
        </article>
      )}
    </div>
  );
}

// --- small presentational helpers ------------------------------------------

const isGap = (gaps: string[], field: string) => gaps.includes(field);

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

function StringList({ items }: { items: string[] }) {
  if (!items || items.length === 0) return <p style={S.muted}>— none —</p>;
  return (
    <ul style={S.ul}>
      {items.map((t, i) => (
        <li key={i} style={S.li}>{t}</li>
      ))}
    </ul>
  );
}

function CommandTable({ items }: { items: CommandExample[] }) {
  if (!items || items.length === 0) return <p style={S.muted}>— none —</p>;
  return (
    <div style={S.scrollX}>
      <table style={S.table}>
        <tbody>
          {items.map((c, i) => (
            <tr key={i}>
              <td style={S.cmdCell}><code style={S.code}>{c.command}</code></td>
              <td style={S.purposeCell}>{c.purpose}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CliBlocks({ items }: { items: CliExample[] }) {
  if (!items || items.length === 0) return <p style={S.muted}>— none —</p>;
  return (
    <>
      {items.map((ex, i) => (
        <div key={i} style={S.cliBlock}>
          <div style={S.cliTitle}>{ex.title}</div>
          <pre style={S.pre}>{ex.code}</pre>
          {ex.explanation && <div style={S.muted}>{ex.explanation}</div>}
        </div>
      ))}
    </>
  );
}

function TroubleshootingList({ items }: { items: TroubleshootingNote[] }) {
  if (!items || items.length === 0) return <p style={S.muted}>— none —</p>;
  return (
    <div>
      {items.map((t, i) => (
        <div key={i} style={S.tsNote}>
          <div><strong style={S.tsSymptom}>Symptom:</strong> {t.symptom}</div>
          <div><strong style={S.tsCause}>Cause:</strong> {t.cause}</div>
          <div><strong style={S.tsFix}>Fix:</strong> {t.fix}</div>
        </div>
      ))}
    </div>
  );
}

function DifficultyBadge({ value }: { value: Difficulty }) {
  const color = value === "Hard" ? "#c0392b" : value === "Medium" ? "#b8860b" : "#2e7d32";
  return <span style={{ ...S.badge, background: color }}>{value}</span>;
}

function CompletenessBadge({ value }: { value: Completeness }) {
  const color = value === "high" ? "#2e7d32" : value === "partial" ? "#b8860b" : "#c0392b";
  return <span style={{ ...S.badge, background: color }}>{value}</span>;
}

// --- inline styles (self-contained, no CSS deps) ---------------------------

const S: Record<string, React.CSSProperties> = {
  page: { padding: "24px 0 0", fontFamily: "var(--font-ui, system-ui), -apple-system, Segoe UI, Roboto, sans-serif", color: "#1a1a1a", lineHeight: 1.5 },
  tab: { padding: "6px 14px", border: "1px solid #ccc", borderRadius: 6, background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13 },
  tabActive: { background: "#1a3d7c", color: "#fff", borderColor: "#1a3d7c" },
  breadcrumb: { fontSize: 13, color: "#616161", marginBottom: 4 },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, borderBottom: "2px solid #eee", paddingBottom: 12 },
  h1: { margin: 0, fontSize: 30, letterSpacing: 0.5 },
  badges: { display: "flex", gap: 8, alignItems: "center" },
  badge: { color: "#fff", padding: "3px 10px", borderRadius: 12, fontSize: 12, fontWeight: 700 },
  metaBadge: { color: "#616161", fontSize: 12 },
  overview: { fontSize: 16, color: "#333", marginTop: 16 },
  gapsBanner: { background: "#fff8e1", border: "1px solid #ffe082", borderRadius: 6, padding: "8px 12px", fontSize: 13, color: "#7a5c00", margin: "12px 0" },
  section: { marginTop: 24 },
  h2: { fontSize: 18, margin: "0 0 8px", color: "#1a3d7c", display: "flex", alignItems: "center", gap: 8 },
  gapTag: { fontSize: 10, fontWeight: 700, textTransform: "uppercase", background: "#e0e0e0", color: "#5a5a5a", padding: "2px 6px", borderRadius: 4 },
  ul: { margin: 0, paddingLeft: 20 },
  li: { marginBottom: 6 },
  scrollX: { overflowX: "auto", maxWidth: "100%" },
  table: { borderCollapse: "collapse", width: "100%" },
  cmdCell: { padding: "6px 10px 6px 0", verticalAlign: "top", whiteSpace: "nowrap" },
  purposeCell: { padding: "6px 0", verticalAlign: "top", color: "#444", fontSize: 14 },
  code: { background: "#f4f4f4", padding: "2px 6px", borderRadius: 4, fontSize: 13, fontFamily: "Consolas, Menlo, monospace", color: "#a11" },
  mono: { fontFamily: "Consolas, Menlo, monospace", fontSize: 13, background: "#f7f7f7", padding: 12, borderRadius: 6, whiteSpace: "pre-wrap" },
  cliBlock: { marginBottom: 14 },
  cliTitle: { fontWeight: 600, fontSize: 14, marginBottom: 4 },
  pre: { background: "#1e1e1e", color: "#e6e6e6", padding: 12, borderRadius: 6, overflowX: "auto", fontSize: 13, margin: "0 0 4px" },
  tsNote: { borderLeft: "3px solid #1a3d7c", paddingLeft: 12, marginBottom: 14, fontSize: 14 },
  tsSymptom: { color: "#c0392b" },
  tsCause: { color: "#b8860b" },
  tsFix: { color: "#2e7d32" },
  chips: { display: "flex", flexWrap: "wrap", gap: 6 },
  chip: { background: "#eef2fb", color: "#1a3d7c", padding: "3px 10px", borderRadius: 12, fontSize: 13, fontWeight: 600 },
  muted: { color: "#595959", fontSize: 13 },
  error: { background: "#fdecea", border: "1px solid #f5c6cb", borderRadius: 6, padding: "12px 14px", color: "#8a1c1c", marginBottom: 16 },
  footer: { marginTop: 32, paddingTop: 12, borderTop: "1px solid #eee", fontSize: 12, color: "#999" },
};
