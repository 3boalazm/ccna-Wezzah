// state/useQuizSession.ts
// Local, page-scoped state for an active quiz/exam session (current question
// index, answers given, timer). Intentionally NOT global — this is only ever
// needed by QuestionBankPage / ExamPage while a session is active.

import { useState } from "react";
import type { QuestionItem } from "../engines/knowledge-engine/types";

export function useQuizSession(questions: QuestionItem[]) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const answer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const next = () => setCurrentIndex((i) => Math.min(i + 1, questions.length - 1));
  const prev = () => setCurrentIndex((i) => Math.max(i - 1, 0));

  return {
    currentQuestion: questions[currentIndex],
    currentIndex,
    total: questions.length,
    answers,
    answer,
    next,
    prev,
  };
}
