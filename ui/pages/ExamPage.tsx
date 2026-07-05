// ui/pages/ExamPage.tsx
// Timed, full-length simulation built by the Exam Engine from the default
// blueprint (domain-weighted question mix). No penalty for guessing —
// every question can always be skipped, per the exam-engine's own contract
// comment. Score is broken down per-domain at the end, mirroring how the
// real CCNA score report is organized.

import React, { useEffect, useMemo, useRef, useState } from "react";
import * as examEngine from "../../engines/exam-engine";
import * as reviewEngine from "../../engines/review-engine";
import { getCurrentUserId } from "../../services/current-user";
import type { ExamSession } from "../../engines/exam-engine";

export default function ExamPage() {
  const [session, setSession] = useState<ExamSession | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { picked?: string; correct: boolean }>>({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [finished, setFinished] = useState(false);
  const timerRef = useRef<number | null>(null);

  const start = () => {
    const s = examEngine.generateExam(examEngine.defaultBlueprint);
    setSession(s);
    setIndex(0);
    setAnswers({});
    setFinished(false);
    setSecondsLeft(s.time_limit_minutes * 60);
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

  const domainBreakdown = useMemo(() => {
    if (!session) return [];
    const byTopic = new Map<string, { total: number; correct: number }>();
    for (const q of session.questions) {
      const entry = byTopic.get(q.source_topic) ?? { total: 0, correct: 0 };
      entry.total += 1;
      if (answers[q.id]?.correct) entry.correct += 1;
      byTopic.set(q.source_topic, entry);
    }
    return [...byTopic.entries()].sort((a, b) => b[1].total - a[1].total);
  }, [session, answers]);

  if (!session) {
    return (
      <div style={S.intro} className="ccna-anim-fade-up">
        <div style={S.introBadge}>⏱️ Exam simulator</div>
        <h1 style={S.introTitle}>Full-length timed CCNA simulation</h1>
        <p style={S.introBody}>
          {examEngine.defaultBlueprint.total_questions} questions across{" "}
          {Object.keys(examEngine.defaultBlueprint.domain_weights).length} domains,{" "}
          {examEngine.defaultBlueprint.time_limit_minutes} minutes on the clock. No penalty for
          guessing — you can skip anything and come back later.
        </p>
        <button style={S.startBtn} className="ccna-hoverable ccna-press" onClick={start}>
          Start exam
        </button>
      </div>
    );
  }

  const graded = session.questions.filter((q) => answers[q.id] !== undefined);
  const correctCount = graded.filter((q) => answers[q.id].correct).length;

  if (finished || index >= session.questions.length) {
    const pct = graded.length ? Math.round((correctCount / graded.length) * 100) : 0;
    return (
      <div style={S.finish} className="ccna-anim-fade-up">
        <div style={S.finishBadge}>{pct >= 80 ? "🏆" : pct >= 50 ? "🙂" : "📚"}</div>
        <h2 style={S.finishTitle}>Exam session finished</h2>
        <div style={S.bigScore} className="ccna-anim-pop">
          {pct}%
        </div>
        <p style={S.muted}>
          {correctCount} correct out of {graded.length} answered ({session.questions.length} total,{" "}
          {session.questions.length - graded.length} skipped).
        </p>
        <div style={S.breakdown}>
          {domainBreakdown.map(([topic, stat]) => (
            <div key={topic} style={S.breakdownRow}>
              <span style={S.breakdownTopic}>{topic.toUpperCase()}</span>
              <div style={S.breakdownTrack}>
                <div
                  style={{
                    ...S.breakdownFill,
                    width: `${(stat.correct / stat.total) * 100}%`,
                  }}
                />
              </div>
              <span style={S.breakdownScore}>
                {stat.correct}/{stat.total}
              </span>
            </div>
          ))}
        </div>
        <button style={S.startBtn} className="ccna-hoverable ccna-press" onClick={start}>
          Start a new exam
        </button>
      </div>
    );
  }

  const q = session.questions[index];
  const state = answers[q.id];
  const mm = Math.floor(secondsLeft / 60);
  const ss = secondsLeft % 60;
  const lowTime = secondsLeft < 300;

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

  return (
    <div style={S.page}>
      <div style={S.topbar}>
        <span style={S.scorePill}>
          {correctCount} / {graded.length}
        </span>
        <span style={{ ...S.timer, color: lowTime ? "#C0392B" : "var(--text-primary)" }}>
          {lowTime ? "⏰ " : "⏱ "}
          {mm}:{ss.toString().padStart(2, "0")}
        </span>
        <span style={S.progressLabel}>
          Question {index + 1} of {session.questions.length}
        </span>
      </div>
      <div style={S.progressTrack}>
        <div
          style={{ ...S.progressFill, width: `${((index + 1) / session.questions.length) * 100}%` }}
        />
      </div>

      <div key={q.id} style={S.card} className="ccna-anim-fade-up">
        <div style={S.qmeta}>
          <span style={S.topicTag}>{q.source_topic.toUpperCase()}</span>
          <span style={S.diffTag}>{q.difficulty}</span>
          <span style={S.formatTag}>{q.format}</span>
        </div>
        <p style={S.prompt}>{q.prompt}</p>

        {q.format === "mcq" && q.options && (
          <div>
            {q.options.map((opt) => {
              let style = { ...S.option };
              if (state) {
                if (opt === q.correct_answer) style = { ...style, ...S.optionCorrect };
                else if (opt === state.picked) style = { ...style, ...S.optionWrong };
              }
              return (
                <button
                  key={opt}
                  type="button"
                  disabled={!!state}
                  onClick={() => answer(opt)}
                  style={style}
                  className={!state ? "ccna-hoverable ccna-press" : undefined}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {q.format !== "mcq" && (
          <div style={S.recallBox}>
            This is a recall-style exam item — say your answer out loud, then move on; there's no
            fixed key for open recall prompts (matches the source material's own convention).
          </div>
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
          Previous
        </button>
        <button
          type="button"
          style={S.navBtn}
          className="ccna-hoverable ccna-press"
          onClick={() => setIndex((i) => i + 1)}
        >
          {index === session.questions.length - 1 ? "Finish" : state ? "Next" : "Skip"}
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
    background: "var(--accent-bg, #EEECFC)", color: "var(--accent-text, #4B3FB0)", marginBottom: 16,
  },
  introTitle: { fontSize: 24, margin: "0 0 12px", color: "var(--text-primary)" },
  introBody: { fontSize: 15, color: "var(--text-secondary)", maxWidth: 480, margin: "0 auto 24px", lineHeight: 1.6 },
  startBtn: { padding: "12px 28px", borderRadius: 8, border: "none", background: "var(--accent, #6C5CE7)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" },
  page: { fontFamily: "var(--font-ui)" },
  topbar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 },
  scorePill: { fontSize: 12.5, fontWeight: 700, padding: "5px 12px", borderRadius: 999, background: "var(--accent-bg, #EEECFC)", color: "var(--accent-text, #4B3FB0)" },
  timer: { fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums" },
  progressLabel: { fontSize: 12, color: "var(--text-muted)" },
  progressTrack: { height: 6, borderRadius: 3, background: "var(--border, #E3E2DC)", overflow: "hidden", marginBottom: 20 },
  progressFill: { height: "100%", background: "var(--accent, #6C5CE7)", transition: "width .2s" },
  card: { background: "var(--card-bg)", border: "1px solid var(--border, #E3E2DC)", borderRadius: 12, padding: "20px 22px", marginBottom: 16 },
  qmeta: { display: "flex", alignItems: "center", gap: 8, marginBottom: 10 },
  topicTag: { fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 999, textTransform: "uppercase", background: "var(--accent-bg, #EEECFC)", color: "var(--accent-text, #4B3FB0)" },
  diffTag: { fontSize: 11, color: "var(--text-muted)" },
  formatTag: { marginLeft: "auto", fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" },
  prompt: { fontSize: 15.5, lineHeight: 1.5, margin: "0 0 14px" },
  option: { display: "block", width: "100%", textAlign: "left", padding: "11px 14px", marginBottom: 8, border: "1px solid var(--border, #E3E2DC)", borderRadius: 8, background: "var(--card-bg)", fontSize: 14, cursor: "pointer", color: "var(--text-primary)" },
  optionCorrect: { background: "#E7F3E8", borderColor: "#2E7D32", color: "#1c4a20", fontWeight: 600 },
  optionWrong: { background: "#FBEAE8", borderColor: "#C0392B", color: "#7a1f1f", fontWeight: 600 },
  recallBox: { padding: "12px 14px", background: "#F7F6FF", borderLeft: "3px solid var(--accent, #6C5CE7)", borderRadius: "0 8px 8px 0", fontSize: 13.5, color: "var(--text-secondary)" },
  navRow: { display: "flex", justifyContent: "space-between" },
  navBtn: { padding: "6px 14px", border: "1px solid var(--border, #E3E2DC)", borderRadius: 999, background: "var(--card-bg)", fontSize: 12.5, fontWeight: 600, cursor: "pointer" },
  finish: { textAlign: "center", padding: "40px 20px" },
  finishBadge: { fontSize: 36, marginBottom: 4 },
  finishTitle: { fontSize: 22, margin: "0 0 6px" },
  bigScore: { fontSize: 44, fontWeight: 700, color: "var(--accent, #6C5CE7)", margin: "10px 0" },
  muted: { color: "var(--text-muted)", fontSize: 13.5 },
  breakdown: { maxWidth: 420, margin: "24px auto", textAlign: "left" },
  breakdownRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 8 },
  breakdownTopic: { fontSize: 11, fontWeight: 700, width: 90, flexShrink: 0, color: "var(--text-secondary)" },
  breakdownTrack: { flex: 1, height: 6, borderRadius: 3, background: "var(--border, #E3E2DC)", overflow: "hidden" },
  breakdownFill: { height: "100%", background: "var(--accent, #6C5CE7)" },
  breakdownScore: { fontSize: 12, width: 40, textAlign: "right", color: "var(--text-muted)" },
};
