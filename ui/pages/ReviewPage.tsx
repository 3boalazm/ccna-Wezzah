// ui/pages/ReviewPage.tsx
// Review Dashboard — surfaces the spaced-repetition forecast from
// review-engine.getReviewForecast(). Since attempts now get recorded by
// QuestionBankPage and ExamPage, this fills up naturally as the learner
// actually studies (nothing here is fabricated / seeded).

import React, { useMemo, useState } from "react";
import * as reviewEngine from "../../engines/review-engine";
import * as adaptiveEngine from "../../engines/adaptive-engine";
import { getCurrentUserId } from "../../services/current-user";

export default function ReviewPage() {
  const userId = useMemo(() => getCurrentUserId(), []);
  const [refreshTick, setRefreshTick] = useState(0);

  const forecast = useMemo(
    () => reviewEngine.getReviewForecast(userId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, refreshTick]
  );
  const due = forecast.filter((f) => f.is_due);
  const upcoming = forecast.filter((f) => !f.is_due).slice(0, 8);

  const topicsSeen = useMemo(() => [...new Set(forecast.map((f) => f.topic_id))], [forecast]);
  const signals = useMemo(
    () => topicsSeen.map((t) => ({ topic: t, ...adaptiveEngine.getDifficultySignal(userId, t) })),
    [topicsSeen, userId]
  );

  if (forecast.length === 0) {
    return (
      <div style={S.empty} className="ccna-anim-fade-up">
        <div style={S.emptyBadge}>📭 Nothing to review yet</div>
        <p style={S.muted}>
          The Review Engine schedules questions using spaced repetition, but it needs at least one
          answered question to work with. Answer a few questions in the Question Bank or Exam
          Simulator, then come back here.
        </p>
      </div>
    );
  }

  return (
    <div style={S.page} className="ccna-anim-fade-up">
      <header style={S.header}>
        <div style={S.badge}>🔁 Review dashboard</div>
        <h1 style={S.title}>Spaced-repetition queue</h1>
        <p style={S.subtitle}>
          {due.length} question{due.length === 1 ? "" : "s"} due right now, out of{" "}
          {forecast.length} tracked.
        </p>
      </header>

      <div style={S.statsRow}>
        <StatCard label="Due now" value={due.length} tone="due" />
        <StatCard label="Scheduled" value={forecast.length - due.length} tone="scheduled" />
        <StatCard label="Topics tracked" value={topicsSeen.length} tone="topics" />
      </div>

      {due.length > 0 && (
        <section style={S.section}>
          <h2 style={S.h2}>Due now</h2>
          <div style={S.list}>
            {due.map((item) => (
              <div key={item.question_id} style={S.dueRow} className="ccna-anim-fade-up">
                <span style={S.dueDot} />
                <span style={S.dueTopic}>{item.topic_id.toUpperCase()}</span>
                <span style={S.dueId}>{item.question_id}</span>
                <span style={S.dueStreak}>streak {item.streak}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section style={S.section}>
          <h2 style={S.h2}>Coming up</h2>
          <div style={S.list}>
            {upcoming.map((item) => (
              <div key={item.question_id} style={S.upcomingRow}>
                <span style={S.upcomingTopic}>{item.topic_id.toUpperCase()}</span>
                <span style={S.dueId}>{item.question_id}</span>
                <span style={S.upcomingDate}>
                  due {new Date(item.due_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section style={S.section}>
        <h2 style={S.h2}>Difficulty signal per topic</h2>
        <p style={S.hint}>
          This is what the Adaptive Engine will hand the Question Bank as the next target
          difficulty, once a topic has enough recent attempts.
        </p>
        <div style={S.list}>
          {signals.map((s) => (
            <div key={s.topic} style={S.signalRow}>
              <span style={S.signalTopic}>{s.topic.toUpperCase()}</span>
              <TargetBadge value={s.target} />
              <span style={S.signalMeta}>
                {s.accuracy === null
                  ? `${s.sampleSize} attempt${s.sampleSize === 1 ? "" : "s"} — not enough yet`
                  : `${Math.round(s.accuracy * 100)}% over last ${s.sampleSize}`}
              </span>
            </div>
          ))}
        </div>
      </section>

      <button
        style={S.refreshBtn}
        className="ccna-hoverable ccna-press"
        onClick={() => setRefreshTick((t) => t + 1)}
      >
        ↻ Refresh
      </button>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  const colors: Record<string, string> = {
    due: "#C0392B",
    scheduled: "var(--accent, #6C5CE7)",
    topics: "#0F6E56",
  };
  return (
    <div style={S.statCard} className="ccna-hoverable">
      <div style={{ ...S.statValue, color: colors[tone] }}>{value}</div>
      <div style={S.statLabel}>{label}</div>
    </div>
  );
}

function TargetBadge({ value }: { value: "Easy" | "Medium" | "Hard" }) {
  const color = value === "Hard" ? "#c0392b" : value === "Medium" ? "#b8860b" : "#2e7d32";
  return <span style={{ ...S.targetBadge, background: color }}>{value}</span>;
}

const S: Record<string, React.CSSProperties> = {
  page: { fontFamily: "var(--font-ui)" },
  header: { marginBottom: 16 },
  badge: { display: "inline-block", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, padding: "5px 14px", borderRadius: 999, background: "var(--accent-bg, #EEECFC)", color: "var(--accent-text, #4B3FB0)", marginBottom: 12 },
  title: { fontSize: 24, margin: "0 0 6px", color: "var(--text-primary)" },
  subtitle: { fontSize: 14, color: "var(--text-secondary)" },
  statsRow: { display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" },
  statCard: { flex: "1 1 120px", background: "var(--card-bg)", border: "1px solid var(--border, #E3E2DC)", borderRadius: 12, padding: "16px", textAlign: "center" },
  statValue: { fontSize: 28, fontWeight: 700 },
  statLabel: { fontSize: 12, color: "var(--text-muted)", marginTop: 2 },
  section: { marginBottom: 26 },
  h2: { fontSize: 16, margin: "0 0 10px", color: "var(--text-primary)" },
  hint: { fontSize: 12.5, color: "var(--text-muted)", margin: "0 0 10px" },
  list: { display: "flex", flexDirection: "column", gap: 6 },
  dueRow: { display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, background: "#FBEAE8", fontSize: 13 },
  dueDot: { width: 7, height: 7, borderRadius: "50%", background: "#C0392B", flexShrink: 0 },
  dueTopic: { fontWeight: 700, color: "#7a1f1f", width: 90 },
  dueId: { color: "var(--text-secondary)", flex: 1, fontFamily: "var(--font-mono)", fontSize: 12 },
  dueStreak: { color: "var(--text-muted)", fontSize: 12 },
  upcomingRow: { display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, background: "var(--card-bg)", border: "1px solid var(--border, #E3E2DC)", fontSize: 13 },
  upcomingTopic: { fontWeight: 700, color: "var(--text-secondary)", width: 90 },
  upcomingDate: { color: "var(--text-muted)", fontSize: 12, marginLeft: "auto" },
  signalRow: { display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, background: "var(--card-bg)", border: "1px solid var(--border, #E3E2DC)", fontSize: 13 },
  signalTopic: { fontWeight: 700, color: "var(--text-secondary)", width: 90 },
  signalMeta: { color: "var(--text-muted)", fontSize: 12, marginLeft: "auto" },
  targetBadge: { color: "#fff", padding: "2px 9px", borderRadius: 999, fontSize: 11, fontWeight: 700 },
  refreshBtn: { padding: "8px 16px", borderRadius: 999, border: "1px solid var(--border, #E3E2DC)", background: "var(--card-bg)", fontSize: 12.5, fontWeight: 600, cursor: "pointer" },
  empty: { padding: "60px 20px", textAlign: "center" },
  emptyBadge: { display: "inline-block", fontSize: 15, fontWeight: 700, marginBottom: 12, color: "var(--text-primary)" },
  muted: { color: "var(--text-secondary)", fontSize: 14, maxWidth: 440, margin: "0 auto", lineHeight: 1.6 },
};
