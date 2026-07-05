// ui/pages/ReviewPage.tsx
// Review Dashboard — surfaces the spaced-repetition forecast from
// review-engine.getReviewForecast(). Since attempts get recorded by
// QuestionBankPage and ExamPage, this fills up naturally as the learner
// actually studies (nothing here is fabricated / seeded). Fully bilingual
// via useLanguage(); domain labels resolve through t("common.domains.*")
// rather than the engine's own English DOMAIN_LABELS.

import React, { useMemo, useState } from "react";
import * as reviewEngine from "../../engines/review-engine";
import * as adaptiveEngine from "../../engines/adaptive-engine";
import { getCurrentUserId } from "../../services/current-user";
import { getDomainMastery } from "../lib/analytics";
import RadarChart from "../components/RadarChart";
import { useLanguage } from "../i18n/LanguageContext";

export default function ReviewPage() {
  const { t } = useLanguage();
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
  const mastery = useMemo(
    () => getDomainMastery(userId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, refreshTick]
  );

  if (forecast.length === 0) {
    return (
      <div style={S.empty} className="ccna-anim-fade-up">
        <div style={S.emptyBadge}>{t("review.emptyBadge")}</div>
        <p style={S.muted}>{t("review.emptyBody")}</p>
      </div>
    );
  }

  return (
    <div style={S.page} className="ccna-anim-fade-up">
      <header style={S.header}>
        <div style={S.badge}>{t("review.badge")}</div>
        <h1 style={S.title}>{t("review.title")}</h1>
        <p style={S.subtitle}>{t("review.subtitle", { due: due.length, total: forecast.length })}</p>
      </header>

      <div style={S.statsRow}>
        <StatCard label={t("review.dueNow")} value={due.length} tone="due" />
        <StatCard label={t("review.scheduled")} value={forecast.length - due.length} tone="scheduled" />
        <StatCard label={t("review.topicsTracked")} value={topicsSeen.length} tone="topics" />
      </div>

      {mastery.length >= 3 && (
        <section style={{ ...S.section, textAlign: "center" }}>
          <h2 style={{ ...S.h2, textAlign: "start" }}>{t("dashboard.masteryByDomain")}</h2>
          <div style={S.radarWrap}>
            <RadarChart data={mastery.map((m) => ({ label: t(`common.domains.${m.domain}`), score: m.score }))} size={240} />
          </div>
        </section>
      )}

      {due.length > 0 && (
        <section style={S.section}>
          <h2 style={S.h2}>{t("review.dueNow")}</h2>
          <div style={S.list}>
            {due.map((item) => (
              <div key={item.question_id} style={S.dueRow} className="ccna-anim-fade-up">
                <span style={S.dueDot} />
                <span style={S.dueTopic} dir="ltr">{item.topic_id.toUpperCase()}</span>
                <span style={S.dueId} dir="ltr">{item.question_id}</span>
                <span style={S.dueStreak}>{t("review.streak", { n: item.streak })}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section style={S.section}>
          <h2 style={S.h2}>{t("review.comingUp")}</h2>
          <div style={S.list}>
            {upcoming.map((item) => (
              <div key={item.question_id} style={S.upcomingRow}>
                <span style={S.upcomingTopic} dir="ltr">{item.topic_id.toUpperCase()}</span>
                <span style={S.dueId} dir="ltr">{item.question_id}</span>
                <span style={S.upcomingDate}>{t("review.due", { date: new Date(item.due_at).toLocaleDateString() })}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section style={S.section}>
        <h2 style={S.h2}>{t("review.difficultySignal")}</h2>
        <p style={S.hint}>{t("review.difficultyHint")}</p>
        <div style={S.list}>
          {signals.map((s) => (
            <div key={s.topic} style={S.signalRow}>
              <span style={S.signalTopic} dir="ltr">{s.topic.toUpperCase()}</span>
              <TargetBadge value={s.target} />
              <span style={S.signalMeta}>
                {s.accuracy === null
                  ? t("review.attemptsNotEnough", { n: s.sampleSize })
                  : t("review.accuracyOverLast", { pct: Math.round(s.accuracy * 100), n: s.sampleSize })}
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
        {t("review.refresh")}
      </button>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  const colors: Record<string, string> = {
    due: "var(--difficulty-hard)",
    scheduled: "var(--accent)",
    topics: "var(--domain-ip-services)",
  };
  return (
    <div style={S.statCard} className="ccna-hoverable">
      <div style={{ ...S.statValue, color: colors[tone] }}>{value}</div>
      <div style={S.statLabel}>{label}</div>
    </div>
  );
}

function TargetBadge({ value }: { value: "Easy" | "Medium" | "Hard" }) {
  const { t } = useLanguage();
  const color = value === "Hard" ? "var(--difficulty-hard)" : value === "Medium" ? "var(--difficulty-medium)" : "var(--difficulty-easy)";
  return <span style={{ ...S.targetBadge, background: color }}>{t(`common.difficulty.${value}`)}</span>;
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
  radarWrap: { display: "flex", justifyContent: "center", background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: "var(--radius-card)", padding: "16px" },
  h2: { fontSize: 16, margin: "0 0 10px", color: "var(--text-primary)" },
  hint: { fontSize: 12.5, color: "var(--text-muted)", margin: "0 0 10px" },
  list: { display: "flex", flexDirection: "column", gap: 6 },
  dueRow: { display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, background: "var(--danger-bg)", fontSize: 13 },
  dueDot: { width: 7, height: 7, borderRadius: "50%", background: "var(--difficulty-hard)", flexShrink: 0 },
  dueTopic: { fontWeight: 700, color: "var(--difficulty-hard)", width: 90 },
  dueId: { color: "var(--text-secondary)", flex: 1, fontFamily: "var(--font-mono)", fontSize: 12 },
  dueStreak: { color: "var(--text-muted)", fontSize: 12 },
  upcomingRow: { display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, background: "var(--card-bg)", border: "1px solid var(--border, #E3E2DC)", fontSize: 13 },
  upcomingTopic: { fontWeight: 700, color: "var(--text-secondary)", width: 90 },
  upcomingDate: { color: "var(--text-muted)", fontSize: 12, marginInlineStart: "auto" },
  signalRow: { display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, background: "var(--card-bg)", border: "1px solid var(--border, #E3E2DC)", fontSize: 13 },
  signalTopic: { fontWeight: 700, color: "var(--text-secondary)", width: 90 },
  signalMeta: { color: "var(--text-muted)", fontSize: 12, marginInlineStart: "auto" },
  targetBadge: { color: "#fff", padding: "2px 9px", borderRadius: 999, fontSize: 11, fontWeight: 700 },
  refreshBtn: { padding: "8px 16px", borderRadius: 999, border: "1px solid var(--border, #E3E2DC)", background: "var(--card-bg)", fontSize: 12.5, fontWeight: 600, cursor: "pointer" },
  empty: { padding: "60px 20px", textAlign: "center" },
  emptyBadge: { display: "inline-block", fontSize: 15, fontWeight: 700, marginBottom: 12, color: "var(--text-primary)" },
  muted: { color: "var(--text-secondary)", fontSize: 14, maxWidth: 440, margin: "0 auto", lineHeight: 1.6 },
};
