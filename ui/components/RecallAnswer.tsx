// ui/components/RecallAnswer.tsx
// The actual input box for free-recall question formats. Fully bilingual
// via useLanguage(); the comparison logic (isCloseMatch) is language-
// agnostic since it only ever runs against English CLI command syntax
// (commands are technical terms and are never translated).

import React, { useState } from "react";
import { isCloseMatch } from "../lib/grading";
import { useLanguage } from "../i18n/LanguageContext";

export interface RecallState {
  typed: string;
  correct: boolean | null; // null = not yet graded
}

export interface RecallAnswerProps {
  correctAnswer?: string; // present for command-completion, absent for fill-blank
  state?: RecallState;
  onSubmit: (typed: string) => void; // first submit — records the attempt, doesn't grade yet
  onGrade: (correct: boolean) => void; // finalizes / overrides the verdict
}

export default function RecallAnswer({ correctAnswer, state, onSubmit, onGrade }: RecallAnswerProps) {
  const { t } = useLanguage();
  const [draft, setDraft] = useState("");

  if (!state) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (draft.trim()) onSubmit(draft);
        }}
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={correctAnswer ? t("recallAnswer.typeCommand") : t("recallAnswer.typeAnswer")}
          rows={correctAnswer ? 2 : 3}
          style={S.textarea}
          autoFocus
        />
        <button type="submit" style={S.submitBtn} className="ccna-hoverable ccna-press" disabled={!draft.trim()}>
          {t("recallAnswer.checkAnswer")}
        </button>
      </form>
    );
  }

  const autoMatched = correctAnswer ? isCloseMatch(state.typed, correctAnswer) : null;
  const verdictKnown = state.correct !== null;

  return (
    <div>
      <div style={S.answerBlock}>
        <span style={S.answerLabel}>{t("recallAnswer.yourAnswer")}</span>
        <pre style={correctAnswer ? S.answerCode : S.answerText}>{state.typed}</pre>
      </div>

      {correctAnswer && (
        <div style={S.answerBlock}>
          <span style={S.answerLabel}>{t("recallAnswer.correctAnswer")}</span>
          <pre style={S.answerCode} dir="ltr">{correctAnswer}</pre>
        </div>
      )}

      {!correctAnswer && !verdictKnown && <div style={S.hintBox}>{t("recallAnswer.hint")}</div>}

      {correctAnswer && !verdictKnown && (
        <div style={{ ...S.hintBox, ...(autoMatched ? S.hintBoxGood : S.hintBoxWarn) }}>
          {autoMatched ? t("recallAnswer.matchGood") : t("recallAnswer.matchWarn")}
        </div>
      )}

      {!verdictKnown && (
        <div style={S.selfGradeRow}>
          <button style={S.knewBtn} className="ccna-hoverable ccna-press" onClick={() => onGrade(true)}>
            {correctAnswer ? t("recallAnswer.markCorrect") : t("recallAnswer.iKnewThis")}
          </button>
          <button style={S.didntBtn} className="ccna-hoverable ccna-press" onClick={() => onGrade(false)}>
            {correctAnswer ? t("recallAnswer.markIncorrect") : t("recallAnswer.iDidntKnowThis")}
          </button>
        </div>
      )}

      {verdictKnown && (
        <div style={{ ...S.verdictBadge, ...(state.correct ? S.verdictGood : S.verdictBad) }}>
          {state.correct ? t("recallAnswer.markedCorrect") : t("recallAnswer.markedIncorrect")}
        </div>
      )}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 12px",
    fontSize: 14,
    fontFamily: "var(--font-mono)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    background: "var(--card-bg)",
    color: "var(--text-primary)",
    resize: "vertical",
    marginBottom: 10,
  },
  submitBtn: {
    padding: "9px 18px",
    borderRadius: 8,
    border: "none",
    background: "var(--accent)",
    color: "#fff",
    fontSize: 13.5,
    fontWeight: 700,
    cursor: "pointer",
  },
  answerBlock: { marginBottom: 10 },
  answerLabel: { display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, color: "var(--text-muted)", marginBottom: 4 },
  answerCode: { margin: 0, padding: "9px 11px", background: "var(--hover-bg)", borderRadius: 8, fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-primary)", whiteSpace: "pre-wrap", wordBreak: "break-word", textAlign: "start" },
  answerText: { margin: 0, padding: "9px 11px", background: "var(--hover-bg)", borderRadius: 8, fontFamily: "var(--font-ui)", fontSize: 14, color: "var(--text-primary)", whiteSpace: "pre-wrap", wordBreak: "break-word" },
  hintBox: { padding: "10px 12px", background: "var(--accent-bg)", borderInlineStart: "3px solid var(--accent)", borderRadius: 8, fontSize: 13.5, color: "var(--text-secondary)", marginBottom: 10 },
  hintBoxGood: { background: "rgba(46,125,50,0.10)", borderInlineStartColor: "var(--difficulty-easy)" },
  hintBoxWarn: { background: "var(--warning-bg)", borderInlineStartColor: "var(--warning)" },
  selfGradeRow: { display: "flex", gap: 8, marginTop: 4 },
  knewBtn: { flex: 1, padding: 9, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "1px solid var(--difficulty-easy)", background: "rgba(46,125,50,0.10)", color: "var(--difficulty-easy)" },
  didntBtn: { flex: 1, padding: 9, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "1px solid var(--difficulty-hard)", background: "var(--danger-bg)", color: "var(--difficulty-hard)" },
  verdictBadge: { display: "inline-block", padding: "5px 12px", borderRadius: 999, fontSize: 12.5, fontWeight: 700 },
  verdictGood: { background: "rgba(46,125,50,0.14)", color: "var(--difficulty-easy)" },
  verdictBad: { background: "var(--danger-bg)", color: "var(--difficulty-hard)" },
};
