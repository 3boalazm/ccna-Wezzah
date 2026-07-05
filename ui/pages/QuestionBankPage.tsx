// ui/pages/QuestionBankPage.tsx
// The ONE engine page that can genuinely work right now, because
// engines/question-engine/index.ts is fully implemented (unlike exam/
// troubleshooting/review/adaptive, which still throw "Not implemented").
// Calls questionEngine.generateQuestionSet() directly against the active
// topic + its direct relations (depth 1, same default the engine itself uses).

import React, { useMemo, useState } from "react";
import * as questionEngine from "../../engines/question-engine";
import * as reviewEngine from "../../engines/review-engine";
import { getCurrentUserId } from "../../services/current-user";
import RecallAnswer from "../components/RecallAnswer";
import type { QuestionItem } from "../../engines/knowledge-engine/types";

export interface QuestionBankPageProps {
  topicId: string;
}

interface AnsweredState {
  picked?: string;
  typed?: string;
  correct: boolean | null; // null = typed but not yet graded
}

export default function QuestionBankPage({ topicId }: QuestionBankPageProps) {
  const questions = useMemo<QuestionItem[]>(() => {
    try {
      return questionEngine.generateQuestionSet({ topicId, depth: 1 });
    } catch {
      return [];
    }
  }, [topicId]);

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnsweredState>>({});

  if (questions.length === 0) {
    return (
      <div style={S.emptyState}>
        <strong>No questions available for "{topicId}" yet.</strong>
        <p style={S.muted}>
          This can happen if the topic's knowledge module is missing config_commands,
          exam_traps, or interview_questions — the Question Engine only generates
          questions from fields that actually have content.
        </p>
      </div>
    );
  }

  if (index >= questions.length) {
    const graded = questions.filter((q) => answers[q.id]?.correct !== null && answers[q.id] !== undefined);
    const correct = graded.filter((q) => answers[q.id].correct).length;
    const pct = graded.length ? Math.round((correct / graded.length) * 100) : 0;
    return (
      <div style={S.finish} className="ccna-anim-fade-up">
        <div style={S.finishBadge}>{pct >= 80 ? "🎉" : pct >= 50 ? "💪" : "📘"}</div>
        <h2 style={S.finishTitle}>Session complete</h2>
        <div style={S.bigScore} className="ccna-anim-pop">
          {pct}%
        </div>
        <p style={S.muted}>
          {correct} correct out of {graded.length} graded questions.
        </p>
        <button
          style={S.restartBtn}
          className="ccna-hoverable ccna-press"
          onClick={() => {
            setIndex(0);
            setAnswers({});
          }}
        >
          Start again
        </button>
      </div>
    );
  }

  const q = questions[index];
  const state = answers[q.id];

  const answerMcq = (picked: string) => {
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

  const answeredCount = questions.filter((qq) => answers[qq.id] !== undefined).length;
  const correctCount = questions.filter((qq) => answers[qq.id]?.correct).length;

  return (
    <div style={S.page}>
      <div style={S.topbar}>
        <span style={S.scorePill}>
          {correctCount} / {answeredCount}
        </span>
        <span style={S.progressLabel}>
          {answeredCount} of {questions.length} answered
        </span>
      </div>
      <div style={S.progressTrack}>
        <div
          style={{ ...S.progressFill, width: `${(answeredCount / questions.length) * 100}%` }}
        />
      </div>

      <div
        key={q.id}
        style={{
          ...S.card,
          borderColor:
            state?.correct === true ? "#2E7D32" : state?.correct === false ? "#C0392B" : "var(--border, #E3E2DC)",
        }}
        className={
          "ccna-anim-fade-up" + (state?.correct === false ? " ccna-anim-shake" : "")
        }
      >
        <div style={S.qmeta}>
          <span style={S.topicTag}>{q.source_topic.toUpperCase()}</span>
          <span style={S.diffTag}>{q.difficulty}</span>
          <span style={S.qnum}>
            {index + 1} / {questions.length}
          </span>
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
                  onClick={() => answerMcq(opt)}
                  style={style}
                  className={!state ? "ccna-hoverable ccna-press" : undefined}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {(q.format === "fill-blank" || q.format === "command-completion") && (
          <RecallAnswer
            correctAnswer={q.correct_answer}
            state={state ? { typed: state.typed ?? "", correct: state.correct } : undefined}
            onSubmit={submitTyped}
            onGrade={(correct) => gradeTyped(state?.typed ?? "", correct)}
          />
        )}
      </div>

      <div style={S.navRow}>
        <button
          type="button"
          style={S.navBtn}
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          Previous
        </button>
        <button type="button" style={S.navBtn} onClick={() => setIndex((i) => i + 1)}>
          {state ? "Next" : "Skip"}
        </button>
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: { fontFamily: "var(--font-ui, system-ui)" },
  topbar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  scorePill: { fontSize: 12.5, fontWeight: 700, padding: "5px 12px", borderRadius: 999, background: "var(--accent-bg, #EEECFC)", color: "var(--accent-text, #4B3FB0)" },
  progressLabel: { fontSize: 12, color: "var(--text-muted, #9C9B94)" },
  progressTrack: { height: 6, borderRadius: 3, background: "var(--border, #E3E2DC)", overflow: "hidden", marginBottom: 20 },
  progressFill: { height: "100%", background: "var(--accent, #6C5CE7)", transition: "width .2s" },
  card: { background: "var(--card-bg)", border: "1px solid var(--border, #E3E2DC)", borderRadius: 12, padding: "20px 22px", marginBottom: 16 },
  qmeta: { display: "flex", alignItems: "center", gap: 8, marginBottom: 10 },
  topicTag: { fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 999, textTransform: "uppercase", background: "var(--accent-bg, #EEECFC)", color: "var(--accent-text, #4B3FB0)" },
  diffTag: { fontSize: 11, color: "var(--text-muted, #9C9B94)" },
  qnum: { marginLeft: "auto", fontSize: 12, color: "var(--text-muted, #9C9B94)" },
  prompt: { fontSize: 15.5, lineHeight: 1.5, margin: "0 0 14px" },
  option: { display: "block", width: "100%", textAlign: "left", padding: "11px 14px", marginBottom: 8, border: "1px solid var(--border, #E3E2DC)", borderRadius: 8, background: "var(--card-bg)", fontSize: 14, cursor: "pointer", color: "var(--text-primary, #1A1A18)" },
  optionCorrect: { background: "#E7F3E8", borderColor: "#2E7D32", color: "#1c4a20", fontWeight: 600 },
  optionWrong: { background: "#FBEAE8", borderColor: "#C0392B", color: "#7a1f1f", fontWeight: 600 },
  navRow: { display: "flex", justifyContent: "space-between" },
  navBtn: { padding: "6px 14px", border: "1px solid var(--border, #E3E2DC)", borderRadius: 999, background: "var(--card-bg)", fontSize: 12.5, fontWeight: 600, cursor: "pointer" },
  emptyState: { padding: "40px 20px", textAlign: "center", color: "var(--text-secondary, #6B6B65)" },
  muted: { color: "var(--text-muted, #9C9B94)", fontSize: 13.5 },
  finish: { textAlign: "center", padding: "40px 20px" },
  finishBadge: { fontSize: 36, marginBottom: 4 },
  finishTitle: { fontSize: 22, margin: "0 0 6px" },
  bigScore: { fontSize: 44, fontWeight: 700, color: "var(--accent, #6C5CE7)", margin: "10px 0" },
  restartBtn: { marginTop: 16, padding: "10px 22px", borderRadius: 8, border: "none", background: "var(--accent, #6C5CE7)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" },
};
