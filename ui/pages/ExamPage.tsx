// ui/pages/ExamPage.tsx
// Timed, full-length simulation built by the Exam Engine. Focus-mode
// session (chrome hidden via onFocusChange), lettered options, flag-for-
// review, and a "3-beat" staged results reveal. Fully bilingual: chrome via
// t(), exam questions come pre-localized from the Exam/Question Engine.
// Command-derived MCQ options (q.id contains "cmdmcq") always render
// dir="ltr" since their text IS a literal CLI command.

import React, { useEffect, useMemo, useRef, useState } from "react";
import * as examEngine from "../../engines/exam-engine";
import * as reviewEngine from "../../engines/review-engine";
import { getCurrentUserId } from "../../services/current-user";
import RecallAnswer from "../components/RecallAnswer";
import { useLanguage } from "../i18n/LanguageContext";
import type { ExamSession } from "../../engines/exam-engine";

export interface ExamPageProps {
  onFocusChange?: (focused: boolean) => void;
}

interface ExamAnswerState {
  picked?: string;
  typed?: string;
  correct: boolean | null; // null = typed but not yet graded (recall formats)
}

const LETTERS_EN = ["A", "B", "C", "D", "E", "F"];
const LETTERS_AR = ["أ", "ب", "ج", "د", "هـ", "و"];

function masteryColor(score: number): string {
  if (score >= 70) return "var(--difficulty-easy)";
  if (score >= 40) return "var(--warning)";
  return "var(--difficulty-hard)";
}

export default function ExamPage({ onFocusChange }: ExamPageProps) {
  const { t, lang } = useLanguage();
  const LETTERS = lang === "ar" ? LETTERS_AR : LETTERS_EN;
  const [session, setSession] = useState<ExamSession | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, ExamAnswerState>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [finished, setFinished] = useState(false);
  const [beat, setBeat] = useState(0);
  const timerRef = useRef<number | null>(null);

  const start = () => {
    const s = examEngine.generateExam(examEngine.defaultBlueprint, lang);
    setSession(s);
    setIndex(0);
    setAnswers({});
    setFlagged(new Set());
    setFinished(false);
    setSecondsLeft(s.time_limit_minutes * 60);
    onFocusChange?.(true);
  };

  useEffect(() => {
    if (!session || finished) return;
    timerRef.current = window.setInterval(() => {
      setSecondsLeft((t) => {
        if (t <= 1) {
          setFinished(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [session, finished]);

  const isResultsScreen = !!session && (finished || index >= session.questions.length);

  useEffect(() => {
    if (!isResultsScreen) return;
    onFocusChange?.(false);
    setBeat(0);
    const t1 = window.setTimeout(() => setBeat(1), 300);
    const t2 = window.setTimeout(() => setBeat(2), 1000);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isResultsScreen]);

  const domainBreakdown = useMemo(() => {
    if (!session) return [];
    const byTopic = new Map<string, { total: number; correct: number }>();
    for (const q of session.questions) {
      const entry = byTopic.get(q.source_topic) ?? { total: 0, correct: 0 };
      entry.total += 1;
      if (answers[q.id]?.correct === true) entry.correct += 1;
      byTopic.set(q.source_topic, entry);
    }
    return [...byTopic.entries()]
      .map(([topic, stat]) => ({ topic, ...stat, pct: stat.total ? Math.round((stat.correct / stat.total) * 100) : 0 }))
      .sort((a, b) => b.total - a.total);
  }, [session, answers]);

  const weakest = useMemo(() => [...domainBreakdown].sort((a, b) => a.pct - b.pct).slice(0, 3), [domainBreakdown]);

  if (!session) {
    return (
      <div style={S.intro} className="ccna-anim-fade-up">
        <div style={S.introBadge}>{t("exam.badge")}</div>
        <h1 style={S.introTitle}>{t("exam.introTitle")}</h1>
        <p style={S.introBody}>
          {t("exam.introBody", {
            total: examEngine.defaultBlueprint.total_questions,
            domains: Object.keys(examEngine.defaultBlueprint.domain_weights).length,
            minutes: examEngine.defaultBlueprint.time_limit_minutes,
          })}
        </p>
        <button style={S.startBtn} className="ccna-hoverable ccna-press" onClick={start}>
          {t("exam.startExam")}
        </button>
      </div>
    );
  }

  const graded = session.questions.filter((q) => answers[q.id]?.correct !== undefined && answers[q.id]?.correct !== null);
  const correctCount = graded.filter((q) => answers[q.id].correct).length;

  if (isResultsScreen) {
    const pct = graded.length ? Math.round((correctCount / graded.length) * 100) : 0;
    return (
      <div style={S.finish}>
        <div style={{ ...S.beat, opacity: 1 }} className="ccna-anim-fade-up">
          <div style={S.finishBadge}>{pct >= 80 ? "🏆" : pct >= 50 ? "🙂" : "📚"}</div>
          <h2 style={S.finishTitle}>{t("exam.examFinished")}</h2>
          <div style={S.bigScore} className="ccna-anim-pop">
            {pct}%
          </div>
          <p style={S.muted}>
            {t("exam.resultSummary", {
              correct: correctCount,
              answered: graded.length,
              total: session.questions.length,
              skipped: session.questions.length - graded.length,
              flagged: flagged.size,
            })}
          </p>
        </div>

        <div style={{ ...S.breakdown, opacity: beat >= 1 ? 1 : 0, transition: "opacity .4s" }}>
          <p style={S.beatLabel}>{t("exam.scoreByDomain")}</p>
          {domainBreakdown.map((d, i) => (
            <div key={d.topic} style={{ ...S.breakdownRow, animationDelay: `${i * 60}ms` }} className={beat >= 1 ? "ccna-anim-fade-up" : undefined}>
              <span style={S.breakdownTopic} dir="ltr">{d.topic.toUpperCase()}</span>
              <div style={S.breakdownTrack}>
                <div style={{ ...S.breakdownFill, width: `${d.pct}%`, background: masteryColor(d.pct) }} />
              </div>
              <span style={{ ...S.breakdownScore, color: masteryColor(d.pct) }}>
                {d.correct}/{d.total}
              </span>
            </div>
          ))}
        </div>

        <div style={{ opacity: beat >= 2 ? 1 : 0, transform: beat >= 2 ? "translateY(0)" : "translateY(10px)", transition: "opacity .4s, transform .4s" }}>
          {weakest.length > 0 && (
            <>
              <p style={{ ...S.beatLabel, marginTop: 22 }}>{t("exam.focusNextOn")}</p>
              <div style={S.weakList}>
                {weakest.map((d, i) => (
                  <div key={d.topic} style={S.weakRow}>
                    <span style={{ ...S.weakRank, background: masteryColor(d.pct) }}>{i + 1}</span>
                    <span style={S.weakTopic} dir="ltr">{d.topic.toUpperCase()}</span>
                    <span style={{ ...S.weakScore, color: masteryColor(d.pct) }}>{d.pct}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
          <div style={{ textAlign: "center" }}>
            <button style={S.startBtn} className="ccna-hoverable ccna-press" onClick={start}>
              {t("exam.startNewExam")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const q = session.questions[index];
  const state = answers[q.id];
  const isCommandOption = q.id.includes("cmdmcq");
  const mm = Math.floor(secondsLeft / 60);
  const ss = secondsLeft % 60;
  const lowTime = secondsLeft < 300;
  const isFlagged = flagged.has(q.id);

  const toggleFlag = () => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(q.id)) next.delete(q.id);
      else next.add(q.id);
      return next;
    });
  };

  const answer = (picked: string) => {
    const correct = picked === q.correct_answer;
    setAnswers((prev) => ({ ...prev, [q.id]: { picked, correct } }));
    reviewEngine.recordAttempt({
      user_id: getCurrentUserId(),
      question_id: q.id,
      topic_id: q.source_topic,
      correct,
      timestamp: new Date().toISOString(),
    });
  };

  const submitTyped = (typed: string) => {
    setAnswers((prev) => ({ ...prev, [q.id]: { typed, correct: null } }));
  };

  const gradeTyped = (typed: string, correct: boolean) => {
    setAnswers((prev) => ({ ...prev, [q.id]: { typed, correct } }));
    reviewEngine.recordAttempt({
      user_id: getCurrentUserId(),
      question_id: q.id,
      topic_id: q.source_topic,
      correct,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div style={S.page}>
      <div style={S.topbar}>
        <span style={S.scorePill}>
          {correctCount} / {graded.length}
        </span>
        <span style={{ ...S.timer, color: lowTime ? "var(--difficulty-hard)" : "var(--text-primary)" }} dir="ltr">
          {lowTime ? "⏰ " : "⏱ "}
          {mm}:{ss.toString().padStart(2, "0")}
        </span>
        <span style={S.progressLabel}>{t("exam.questionOf", { n: index + 1, total: session.questions.length })}</span>
      </div>
      <div style={S.progressTrack}>
        <div style={{ ...S.progressFill, width: `${((index + 1) / session.questions.length) * 100}%` }} />
      </div>

      <div key={q.id} style={S.card} className="ccna-anim-fade-up">
        <div style={S.qmeta}>
          <span style={S.topicTag} dir="ltr">{q.source_topic.toUpperCase()}</span>
          <span style={S.diffTag}>{t(`common.difficulty.${q.difficulty}`)}</span>
          <button type="button" onClick={toggleFlag} className="ccna-press" style={{ ...S.flagBtn, ...(isFlagged ? S.flagBtnActive : null) }}>
            🚩 {isFlagged ? t("exam.flagged") : t("exam.flag")}
          </button>
        </div>
        <p style={S.prompt}>{q.prompt}</p>

        {q.format === "mcq" && q.options && (
          <div>
            {q.options.map((opt, i) => {
              let style = { ...S.option };
              let letterStyle = { ...S.optionLetter };
              if (state) {
                if (opt === q.correct_answer) {
                  style = { ...style, ...S.optionCorrect };
                  letterStyle = { ...letterStyle, ...S.optionLetterCorrect };
                } else if (opt === state.picked) {
                  style = { ...style, ...S.optionWrong };
                  letterStyle = { ...letterStyle, ...S.optionLetterWrong };
                }
              }
              return (
                <button
                  key={opt}
                  type="button"
                  disabled={!!state}
                  onClick={() => answer(opt)}
                  style={style}
                  className={!state ? "ccna-hoverable ccna-press" : undefined}
                  dir={isCommandOption ? "ltr" : undefined}
                >
                  <span style={letterStyle}>{LETTERS[i]}</span>
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {q.format !== "mcq" && (
          <RecallAnswer
            correctAnswer={q.correct_answer}
            state={state ? { typed: state.typed ?? "", correct: state.correct ?? null } : undefined}
            onSubmit={submitTyped}
            onGrade={(correct) => gradeTyped(state?.typed ?? "", correct)}
          />
        )}
      </div>

      <div style={S.navRow}>
        <button
          type="button"
          style={S.navBtn}
          className="ccna-hoverable ccna-press"
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          {t("questionBank.previous")}
        </button>
        <button
          type="button"
          style={S.navBtn}
          className="ccna-hoverable ccna-press"
          onClick={() => setIndex((i) => i + 1)}
        >
          {index === session.questions.length - 1 ? t("exam.finish") : state ? t("questionBank.next") : t("questionBank.skip")}
        </button>
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  intro: { padding: "60px 20px", textAlign: "center" },
  introBadge: {
    display: "inline-block", fontSize: 12, fontWeight: 700, textTransform: "uppercase",
    letterSpacing: 0.5, padding: "5px 14px", borderRadius: 999,
    background: "var(--accent-bg)", color: "var(--accent-text)", marginBottom: 16,
  },
  introTitle: { fontSize: 24, margin: "0 0 12px", color: "var(--text-primary)" },
  introBody: { fontSize: 15, color: "var(--text-secondary)", maxWidth: 480, margin: "0 auto 24px", lineHeight: 1.6 },
  startBtn: { padding: "12px 28px", borderRadius: 8, border: "none", background: "var(--accent)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" },
  page: { fontFamily: "var(--font-ui)" },
  topbar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 },
  scorePill: { fontSize: 12.5, fontWeight: 700, padding: "5px 12px", borderRadius: 999, background: "var(--accent-bg)", color: "var(--accent-text)" },
  timer: { fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums" },
  progressLabel: { fontSize: 12, color: "var(--text-muted)" },
  progressTrack: { height: 6, borderRadius: 3, background: "var(--border)", overflow: "hidden", marginBottom: 20 },
  progressFill: { height: "100%", background: "var(--accent)", transition: "width .2s" },
  card: { background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 22px", marginBottom: 16 },
  qmeta: { display: "flex", alignItems: "center", gap: 8, marginBottom: 10 },
  topicTag: { fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 999, textTransform: "uppercase", background: "var(--accent-bg)", color: "var(--accent-text)" },
  diffTag: { fontSize: 11, color: "var(--text-muted)" },
  flagBtn: { marginInlineStart: "auto", fontSize: 11.5, color: "var(--text-muted)", background: "transparent", border: "1px solid var(--border)", borderRadius: 999, padding: "3px 10px", cursor: "pointer" },
  flagBtnActive: { color: "var(--warning)", borderColor: "var(--warning)", background: "var(--warning-bg)", fontWeight: 700 },
  prompt: { fontSize: 15.5, lineHeight: 1.6, margin: "0 0 14px" },
  option: { display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "start", padding: "11px 14px", marginBottom: 8, border: "1px solid var(--border)", borderRadius: 8, background: "var(--card-bg)", fontSize: 14, cursor: "pointer", color: "var(--text-primary)" },
  optionLetter: { width: 22, height: 22, borderRadius: "50%", border: "1.5px solid var(--border-strong)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", flexShrink: 0 },
  optionLetterCorrect: { borderColor: "var(--difficulty-easy)", background: "var(--difficulty-easy)", color: "#fff" },
  optionLetterWrong: { borderColor: "var(--difficulty-hard)", background: "var(--difficulty-hard)", color: "#fff" },
  optionCorrect: { background: "rgba(46,125,50,0.12)", borderColor: "var(--difficulty-easy)", color: "var(--difficulty-easy)", fontWeight: 600 },
  optionWrong: { background: "var(--danger-bg)", borderColor: "var(--difficulty-hard)", color: "var(--difficulty-hard)", fontWeight: 600 },
  navRow: { display: "flex", justifyContent: "space-between" },
  navBtn: { padding: "6px 14px", border: "1px solid var(--border)", borderRadius: 999, background: "var(--card-bg)", fontSize: 12.5, fontWeight: 600, cursor: "pointer" },
  finish: { padding: "20px 4px 40px", maxWidth: 480, margin: "0 auto" },
  beat: {},
  beatLabel: { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--text-muted)", textAlign: "center", margin: "0 0 10px" },
  finishBadge: { fontSize: 36, marginBottom: 4, textAlign: "center" },
  finishTitle: { fontSize: 22, margin: "0 0 6px", textAlign: "center" },
  bigScore: { fontSize: 44, fontWeight: 700, color: "var(--accent)", margin: "10px 0", textAlign: "center" },
  muted: { color: "var(--text-muted)", fontSize: 13.5, textAlign: "center" },
  breakdown: { margin: "24px 0" },
  breakdownRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 8 },
  breakdownTopic: { fontSize: 11, fontWeight: 700, width: 90, flexShrink: 0, color: "var(--text-secondary)" },
  breakdownTrack: { flex: 1, height: 6, borderRadius: 3, background: "var(--border)", overflow: "hidden" },
  breakdownFill: { height: "100%", transition: "width .5s ease" },
  breakdownScore: { fontSize: 12, width: 40, textAlign: "end", fontWeight: 700, fontFamily: "var(--font-mono)" },
  weakList: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 22 },
  weakRow: { display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, background: "var(--card-bg)", border: "1px solid var(--border)" },
  weakRank: { width: 20, height: 20, borderRadius: "50%", color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  weakTopic: { flex: 1, fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)" },
  weakScore: { fontSize: 12.5, fontWeight: 700, fontFamily: "var(--font-mono)" },
};
