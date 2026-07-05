// ui/pages/DashboardPage.tsx
// Workspace landing page — structure ported from HLOS's learner dashboard.
// Fully bilingual via useLanguage(); topic ids and domain internals stay
// as technical keys, everything the learner reads goes through t().

import React, { useMemo } from "react";
import * as reviewEngine from "../../engines/review-engine";
import { getCurrentUserId } from "../../services/current-user";
import { domainOf } from "../layout/domains";
import { useLanguage } from "../i18n/LanguageContext";
import {
  getOverallAccuracy,
  getDomainMastery,
  getRecentActivity,
  getTopicsEngaged,
  relativeTime,
} from "../lib/analytics";
import RadarChart from "../components/RadarChart";
import ProgressRing from "../components/ProgressRing";

export interface DashboardPageProps {
  topicIds: string[];
  onSelectTopic: (topicId: string) => void;
  onSelectEngine: (engineId: string) => void;
}

const ENGINE_CARDS = [
  { id: "question-bank", emoji: "📝" },
  { id: "exam", emoji: "⏱️" },
  { id: "troubleshooting", emoji: "🧩" },
  { id: "review", emoji: "🔁" },
];

export default function DashboardPage({ topicIds, onSelectTopic, onSelectEngine }: DashboardPageProps) {
  const { t } = useLanguage();
  const userId = useMemo(() => getCurrentUserId(), []);
  const dueCount = useMemo(() => reviewEngine.getDueReviews(userId).length, [userId]);
  const accuracy = useMemo(() => getOverallAccuracy(userId), [userId]);
  const mastery = useMemo(() => getDomainMastery(userId), [userId]);
  const recent = useMemo(() => getRecentActivity(userId, 6), [userId]);
  const engaged = useMemo(() => getTopicsEngaged(userId), [userId]);

  const hasActivity = accuracy !== null;
  const weakestDomain = [...mastery].sort((a, b) => a.score - b.score)[0];
  const weakestDomainTopic = weakestDomain
    ? topicIds.find((tid) => domainOf(tid) === weakestDomain.domain)
    : undefined;

  const startPracticing = () => {
    if (dueCount > 0) {
      onSelectEngine("review");
    } else {
      if (weakestDomainTopic) onSelectTopic(weakestDomainTopic);
      onSelectEngine("question-bank");
    }
  };

  const heroTitle =
    dueCount > 0
      ? t("dashboard.heroTitleDue", { count: dueCount })
      : hasActivity && weakestDomain
      ? t("dashboard.heroTitleWeak", { domain: t(`common.domains.${weakestDomain.domain}`) })
      : t("dashboard.heroTitleStart");

  const heroBody =
    dueCount > 0 ? t("dashboard.heroBodyDue") : hasActivity ? t("dashboard.heroBodyWeak") : t("dashboard.heroBodyStart");

  const formatRelative = (r: { unit: "now" | "m" | "h" | "d"; n: number }) =>
    r.unit === "now" ? t("dashboard.time.justNow") : t(`dashboard.time.${r.unit === "m" ? "minutesAgo" : r.unit === "h" ? "hoursAgo" : "daysAgo"}`, { n: r.n });

  return (
    <div className="ccna-anim-fade-up">
      <header style={S.header}>
        <h1 style={S.h1}>{t("common.appName")}</h1>
        <p style={S.subtitle}>{t("dashboard.subtitle", { count: topicIds.length })}</p>
      </header>

      {/* Next best action */}
      <div style={S.hero} className="ccna-hoverable">
        <div style={S.heroIcon}>🎯</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={S.heroKicker}>{t("dashboard.heroKicker")}</p>
          <h2 style={S.heroTitle}>{heroTitle}</h2>
          <p style={S.heroBody}>{heroBody}</p>
        </div>
        <button type="button" className="ccna-hoverable ccna-press" style={S.heroBtn} onClick={startPracticing}>
          {dueCount > 0 ? t("dashboard.goToReview") : t("dashboard.startPracticing")}
        </button>
      </div>

      {/* Stats row */}
      <div style={S.statsGrid}>
        <div style={S.statCard} className="ccna-hoverable">
          <p style={S.statLabel}>{t("dashboard.overallAccuracy")}</p>
          {hasActivity ? (
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <ProgressRing value={accuracy!} size={72} strokeWidth={7} />
              <div>
                <div style={S.statBig}>{accuracy}%</div>
                <div style={S.statMeta}>{t("dashboard.acrossAllAttempts")}</div>
              </div>
            </div>
          ) : (
            <EmptyMiniState text={t("dashboard.noAttemptsYet")} />
          )}
        </div>

        <div style={{ ...S.statCard, alignItems: "center", display: "flex", flexDirection: "column" }} className="ccna-hoverable">
          <p style={{ ...S.statLabel, alignSelf: "flex-start" }}>{t("dashboard.masteryByDomain")}</p>
          {mastery.length >= 3 ? (
            <RadarChart data={mastery.map((m) => ({ label: t(`common.domains.${m.domain}`), score: m.score }))} size={168} showLabels={false} />
          ) : (
            <EmptyMiniState text={t("dashboard.unlockRadarHint")} />
          )}
        </div>

        <div style={S.statCard} className="ccna-hoverable">
          <p style={S.statLabel}>{t("dashboard.topicsCovered")}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <ProgressRing value={(engaged.size / topicIds.length) * 100} size={72} strokeWidth={7} />
            <div>
              <div style={S.statBig}>
                {engaged.size}/{topicIds.length}
              </div>
              <div style={S.statMeta}>{t("dashboard.attemptedAtLeastOnce")}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <section style={S.section}>
        <h3 style={S.sectionTitle}>{t("dashboard.recentActivity")}</h3>
        {recent.length === 0 ? (
          <p style={S.muted}>{t("dashboard.noActivityYet")}</p>
        ) : (
          <div style={S.activityList}>
            {recent.map((a, i) => (
              <div key={a.question_id + a.timestamp + i} style={S.activityRow}>
                <span style={{ ...S.activityDot, background: a.correct ? "var(--difficulty-easy)" : "var(--difficulty-hard)" }} />
                <button type="button" onClick={() => onSelectTopic(a.topic_id)} style={S.activityTopicBtn} className="ccna-hoverable">
                  {a.topic_id.toUpperCase()}
                </button>
                <span style={S.activityText}>{a.correct ? t("dashboard.answeredCorrectly") : t("dashboard.missed")}</span>
                <span style={S.activityTime}>{formatRelative(relativeTime(a.timestamp))}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Engine quick links */}
      <section style={S.section}>
        <h3 style={S.sectionTitle}>{t("dashboard.jumpIntoEngine")}</h3>
        <div style={S.engineGrid}>
          {ENGINE_CARDS.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => onSelectEngine(e.id)}
              style={S.engineCard}
              className="ccna-hoverable ccna-press"
            >
              <span style={S.engineEmoji}>{e.emoji}</span>
              <span style={S.engineTitle}>
                {e.id === "question-bank"
                  ? t("common.questionBank")
                  : e.id === "exam"
                  ? t("common.examSimulator")
                  : e.id === "troubleshooting"
                  ? t("common.scenarioSimulator")
                  : t("common.reviewDashboard")}
              </span>
              <span style={S.engineDesc}>{t(`dashboard.engineDesc.${e.id}`)}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function EmptyMiniState({ text }: { text: string }) {
  return <p style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.5, margin: 0 }}>{text}</p>;
}

const S: Record<string, React.CSSProperties> = {
  header: { marginBottom: 18 },
  h1: { fontSize: 26, margin: "0 0 4px", color: "var(--text-primary)" },
  subtitle: { fontSize: 13.5, color: "var(--text-secondary)", margin: 0 },
  hero: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "18px 20px",
    borderRadius: "var(--radius-card)",
    background: "var(--accent-bg)",
    border: "1px solid var(--accent)",
    marginBottom: 20,
    flexWrap: "wrap",
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: "var(--accent)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    flexShrink: 0,
  },
  heroKicker: { margin: "0 0 2px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--accent-text)" },
  heroTitle: { margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "var(--text-primary)" },
  heroBody: { margin: 0, fontSize: 13, color: "var(--text-secondary)" },
  heroBtn: { padding: "10px 20px", borderRadius: 8, border: "none", background: "var(--accent)", color: "#fff", fontSize: 13.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12, marginBottom: 8 },
  statCard: { background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: "var(--radius-card)", padding: "16px 18px" },
  statLabel: { margin: "0 0 10px", fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, color: "var(--text-muted)" },
  statBig: { fontSize: 24, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-mono)" },
  statMeta: { fontSize: 11.5, color: "var(--text-muted)" },
  section: { marginTop: 26 },
  sectionTitle: { fontSize: 15, margin: "0 0 10px", color: "var(--text-primary)" },
  muted: { fontSize: 13, color: "var(--text-muted)" },
  activityList: { display: "flex", flexDirection: "column", gap: 6 },
  activityRow: { display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, background: "var(--card-bg)", border: "1px solid var(--border)", fontSize: 12.5 },
  activityDot: { width: 7, height: 7, borderRadius: "50%", flexShrink: 0 },
  activityTopic: { fontWeight: 700, color: "var(--text-secondary)", width: 100, flexShrink: 0 },
  activityTopicBtn: { fontWeight: 700, color: "var(--accent-text)", width: 100, flexShrink: 0, background: "none", border: "none", padding: 0, textAlign: "start", cursor: "pointer", fontSize: "inherit", fontFamily: "inherit" },
  activityText: { color: "var(--text-secondary)", flex: 1 },
  activityTime: { color: "var(--text-muted)", fontSize: 11.5 },
  engineGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 },
  engineCard: { display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4, padding: "14px 16px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--card-bg)", cursor: "pointer", textAlign: "start" },
  engineEmoji: { fontSize: 20 },
  engineTitle: { fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)" },
  engineDesc: { fontSize: 11.5, color: "var(--text-muted)" },
};
