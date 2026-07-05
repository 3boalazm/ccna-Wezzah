// ui/components/RecallAnswer.tsx
// The actual input box for free-recall question formats — previously
// "command-completion" had NO interactive element at all (just the prompt
// and a Skip button), and "fill-blank" only offered a blind reveal with no
// place to type anything first. This component fixes both: the learner
// always types their answer before seeing anything, then either gets an
// auto-checked verdict (command-completion, compared leniently against
// placeholders) or a manual self-grade (fill-blank / interview-style
// prompts, which the knowledge base intentionally stores no fixed answer
// for) — with a manual override always available either way, since exact
// string matching against CLI syntax is a convenience, not a verdict.

import React, { useState } from "react";
import { isCloseMatch } from "../lib/grading";

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
          placeholder={correctAnswer ? "Type the IOS command…" : "Type your answer…"}
          rows={correctAnswer ? 2 : 3}
          style={S.textarea}
          autoFocus
        />
        <button type="submit" style={S.submitBtn} className="ccna-hoverable ccna-press" disabled={!draft.trim()}>
          Check my answer
        </button>
      </form>
    );
  }

  const autoMatched = correctAnswer ? isCloseMatch(state.typed, correctAnswer) : null;
  const verdictKnown = state.correct !== null;

  return (
    <div>
      <div style={S.answerBlock}>
        <span style={S.answerLabel}>Your answer</span>
        <pre style={correctAnswer ? S.answerCode : S.answerText}>{state.typed}</pre>
      </div>

      {correctAnswer && (
        <div style={S.answerBlock}>
          <span style={S.answerLabel}>Correct answer</span>
          <pre style={S.answerCode}>{correctAnswer}</pre>
        </div>
      )}

      {!correctAnswer && !verdictKnown && (
        <div style={S.hintBox}>
          This is a recall prompt — the knowledge base intentionally stores no fixed answer for
          interview-style questions. Compare your answer to what you actually know, then grade
          yourself honestly.
        </div>
      )}

      {correctAnswer && !verdictKnown && (
        <div style={{ ...S.hintBox, ...(autoMatched ? S.hintBoxGood : S.hintBoxWarn) }}>
          {autoMatched
            ? "Looks like a match — confirm below."
            : "Doesn't match exactly (placeholders like [name] count as a wildcard). If your command was still functionally correct, mark it right yourself."}
        </div>
      )}

      {!verdictKnown && (
        <div style={S.selfGradeRow}>
          <button
            style={S.knewBtn}
            className="ccna-hoverable ccna-press"
            onClick={() => onGrade(true)}
          >
            {correctAnswer ? "Mark correct" : "I knew this"}
          </button>
          <button
            style={S.didntBtn}
            className="ccna-hoverable ccna-press"
            onClick={() => onGrade(false)}
          >
            {correctAnswer ? "Mark incorrect" : "I didn't know this"}
          </button>
        </div>
      )}

      {verdictKnown && (
        <div style={{ ...S.verdictBadge, ...(state.correct ? S.verdictGood : S.verdictBad) }}>
          {state.correct ? "✓ Marked correct" : "✕ Marked incorrect"}
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
  answerCode: { margin: 0, padding: "9px 11px", background: "var(--hover-bg)", borderRadius: 8, fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-primary)", whiteSpace: "pre-wrap", wordBreak: "break-word" },
  answerText: { margin: 0, padding: "9px 11px", background: "var(--hover-bg)", borderRadius: 8, fontFamily: "var(--font-ui)", fontSize: 14, color: "var(--text-primary)", whiteSpace: "pre-wrap", wordBreak: "break-word" },
  hintBox: { padding: "10px 12px", background: "var(--accent-bg)", borderLeft: "3px solid var(--accent)", borderRadius: "0 8px 8px 0", fontSize: 13.5, color: "var(--text-secondary)", marginBottom: 10 },
  hintBoxGood: { background: "rgba(46,125,50,0.10)", borderLeftColor: "var(--difficulty-easy)" },
  hintBoxWarn: { background: "var(--warning-bg)", borderLeftColor: "var(--warning)" },
  selfGradeRow: { display: "flex", gap: 8, marginTop: 4 },
  knewBtn: { flex: 1, padding: 9, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "1px solid var(--difficulty-easy)", background: "rgba(46,125,50,0.10)", color: "var(--difficulty-easy)" },
  didntBtn: { flex: 1, padding: 9, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "1px solid var(--difficulty-hard)", background: "var(--danger-bg)", color: "var(--difficulty-hard)" },
  verdictBadge: { display: "inline-block", padding: "5px 12px", borderRadius: 999, fontSize: 12.5, fontWeight: 700 },
  verdictGood: { background: "rgba(46,125,50,0.14)", color: "var(--difficulty-easy)" },
  verdictBad: { background: "var(--danger-bg)", color: "var(--difficulty-hard)" },
};
