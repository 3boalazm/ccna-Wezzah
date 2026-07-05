// ui/pages/QuestionBankPage.tsx
// Question Bank — a two-phase flow: a setup screen (difficulty filter, live
// count preview), then a focus-mode session (chrome hidden via
// onFocusChange). Fully bilingual: chrome via t(), questions/options come
// pre-localized from the Question Engine when lang="ar". Command-derived
// MCQ options (q.id contains "cmdmcq") always render dir="ltr" since their
// text IS a literal CLI command, never translated.

import React, { useMemo, useState } from "react";
import * as questionEngine from "../../engines/question-engine";
import * as reviewEngine from "../../engines/review-engine";
import { getCurrentUserId } from "../../services/current-user";
import RecallAnswer from "../components/RecallAnswer";
import { useLanguage } from "../i18n/LanguageContext";
import type { QuestionItem, Difficulty } from "../../engines/knowledge-engine/types";

export interface QuestionBankPageProps {
  topicId: string;
  onFocusChange?: (focused: boolean) => void;
}

interface AnsweredState {
  picked?: string;
  typed?: string;
  correct: boolean | null; // null = typed but not yet graded
}

const LETTERS_EN = ["A", "B", "C", "D", "E", "F"];
const LETTERS_AR = ["أ", "ب", "ج", "د", "هـ", "و"];
const DIFFICULTY_FILTERS: Array<Difficulty | "All"> = ["All", "Easy", "Medium", "Hard"];

export default function QuestionBankPage({ topicId, onFocusChange }: QuestionBankPageProps) {
  const { t, lang } = useLanguage();
  const LETTERS = lang === "ar" ? LETTERS_AR : LETTERS_EN;

  const allQuestions = useMemo<QuestionItem[]>(() => {
    try {
      return questionEngine.generateQuestionSet({ topicId, depth: 1, lang });
    } catch {
      return [];
    }
  }, [topicId, lang]);

  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | "All">("All");
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnsweredState>>({});

  const questions = useMemo(
    () =>
      difficultyFilter === "All" ? allQuestions : allQuestions.filter((q) => q.difficulty === difficultyFilter),
    [allQuestions, difficultyFilter]
  );

  if (allQuestions.length === 0) {
    return (
      <div style={S.emptyState}>
        <strong>{t("questionBank.noQuestionsTitle", { topic: topicId })}</strong>
        <p style={S.muted}>{t("questionBank.noQuestionsBody")}</p>
      </div>
    );
  }

  // --- Phase 1: setup screen --------------------------------------------
  if (!started) {
    return (
      <div className="ccna-anim-fade-up" style={S.setupWrap}>
        <div style={S.setupHeader}>
          <h1 style={S.setupTitle}>{t("questionBank.title")}</h1>
          <p style={S.setupSubtitle}>{t("questionBank.subtitle", { topic: topicId.toUpperCase() })}</p>
        </div>

        <div style={S.setupCard}>
          <label style={S.setupLabel}>{t("questionBank.difficultyLabel")}</label>
          <div style={S.pillRow}>
            {DIFFICULTY_FILTERS.map((d) => {
              const count = d === "All" ? allQuestions.length : allQuestions.filter((q) => q.difficulty === d).length;
              const active = difficultyFilter === d;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficultyFilter(d)}
                  className="ccna-hoverable ccna-press"
                  style={{ ...S.pill, ...(active ? S.pillActive : null) }}
                  disabled={count === 0}
                >
                  {d === "All" ? t("questionBank.all") : t(`common.difficulty.${d}`)} <span style={S.pillCount}>{count}</span>
                </button>
              );
            })}
          </div>

          <div style={S.quotaRow}>
            <span style={S.quotaLabel}>{t("questionBank.questionsInSession")}</span>
            <span style={S.quotaValue}>{questions.length}</span>
          </div>

          <button
            type="button"
            className="ccna-hoverable ccna-press"
            style={S.startBtn}
            disabled={questions.length === 0}
            onClick={() => {
              setIndex(0);
              setAnswers({});
              setStarted(true);
              onFocusChange?.(true);
            }}
          >
            {t("questionBank.startPracticing")}
          </button>
        </div>
      </div>
    );
  }

  // --- Phase 2: results ---------------------------------------------------
  if (index >= questions.length) {
    const graded = questions.filter((q) => answers[q.id]?.correct !== undefined && answers[q.id]?.correct !== null);
    const correct = graded.filter((q) => answers[q.id].correct).length;
    const pct = graded.length ? Math.round((correct / graded.length) * 100) : 0;
    return (
      <div style={S.finish} className="ccna-anim-fade-up">
        <div style={S.finishBadge}>{pct >= 80 ? "🎉" : pct >= 50 ? "💪" : "📘"}</div>
        <h2 style={S.finishTitle}>{t("questionBank.sessionComplete")}</h2>
        <div style={S.bigScore} className="ccna-anim-pop">
          {pct}%
        </div>
        <p style={S.muted}>
          {t("questionBank.correctOutOf", { correct, total: graded.length, skipped: questions.length - graded.length })}
        </p>
        <button
          style={S.restartBtn}
          className="ccna-hoverable ccna-press"
          onClick={() => {
            setStarted(false);
            onFocusChange?.(false);
          }}
        >
          {t("questionBank.practiceAgain")}
        </button>
      </div>
    );
  }

  const q = questions[index];
  const state = answers[q.id];
  const isCommandOption = q.id.includes("cmdmcq");

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
        <span style={S.progressLabel}>{t("questionBank.answered", { answered: answeredCount, total: questions.length })}</span>
      </div>
      <div style={S.progressTrack}>
        <div style={{ ...S.progressFill, width: `${(answeredCount / questions.length) * 100}%` }} />
      </div>

      <div
        key={q.id}
        style={{
          ...S.card,
          borderColor:
            state?.correct === true ? "var(--difficulty-easy)" : state?.correct === false ? "var(--difficulty-hard)" : "var(--border)",
        }}
        className={"ccna-anim-fade-up" + (state?.correct === false ? " ccna-anim-shake" : "")}
      >
        <div style={S.qmeta}>
          <span style={S.topicTag} dir="ltr">{q.source_topic.toUpperCase()}</span>
          <span style={S.diffTag}>{t(`common.difficulty.${q.difficulty}`)}</span>
          <span style={S.qnum}>
            {index + 1} / {questions.length}
          </span>
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
                  onClick={() => answerMcq(opt)}
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
          {state ? t("questionBank.next") : t("questionBank.skip")}
        </button>
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  setupWrap: { maxWidth: 480, margin: "20px auto 0" },
  setupHeader: { textAlign: "center", marginBottom: 20 },
  setupTitle: { fontSize: 22, margin: "0 0 6px", color: "var(--text-primary)" },
  setupSubtitle: { fontSize: 13, color: "var(--text-secondary)", margin: 0 },
  setupCard: { background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: "var(--radius-card)", padding: "22px 22px 20px" },
  setupLabel: { display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 },
  pillRow: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 },
  pill: { padding: "8px 14px", borderRadius: 999, border: "1px solid var(--border)", background: "var(--card-bg)", color: "var(--text-secondary)", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  pillActive: { borderColor: "var(--accent)", background: "var(--accent-bg)", color: "var(--accent-text)" },
  pillCount: { fontSize: 11, opacity: 0.7, marginInlineStart: 3, fontFamily: "var(--font-mono)" },
  quotaRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 10, background: "var(--hover-bg)", fontSize: 12.5, marginBottom: 18 },
  quotaLabel: { color: "var(--text-secondary)" },
  quotaValue: { fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-mono)" },
  startBtn: { width: "100%", padding: "13px 0", borderRadius: 10, border: "none", background: "var(--accent)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" },
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
  qnum: { marginInlineStart: "auto", fontSize: 12, color: "var(--text-muted, #9C9B94)", fontFamily: "var(--font-mono)" },
  prompt: { fontSize: 15.5, lineHeight: 1.6, margin: "0 0 14px" },
  option: { display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "start", padding: "11px 14px", marginBottom: 8, border: "1px solid var(--border, #E3E2DC)", borderRadius: 8, background: "var(--card-bg)", fontSize: 14, cursor: "pointer", color: "var(--text-primary, #1A1A18)" },
  optionLetter: { width: 22, height: 22, borderRadius: "50%", border: "1.5px solid var(--border-strong)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", flexShrink: 0 },
  optionLetterCorrect: { borderColor: "var(--difficulty-easy)", background: "var(--difficulty-easy)", color: "#fff" },
  optionLetterWrong: { borderColor: "var(--difficulty-hard)", background: "var(--difficulty-hard)", color: "#fff" },
  optionCorrect: { background: "rgba(46,125,50,0.12)", borderColor: "var(--difficulty-easy)", color: "var(--difficulty-easy)", fontWeight: 600 },
  optionWrong: { background: "var(--danger-bg)", borderColor: "var(--difficulty-hard)", color: "var(--difficulty-hard)", fontWeight: 600 },
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
