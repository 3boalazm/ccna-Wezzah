// Exam Engine
// Simulates the real CCNA 200-301 exam format: Multiple choice, Drag-and-drop,
// Simulation, Simlet, Testlet (per the Chapter 20 module).
// Depends on Question Engine for CONTENT, never Knowledge Engine directly —
// this keeps Exam Engine focused purely on exam MECHANICS (timing, format
// mix, scoring), not content curation.

import * as questionEngine from "../question-engine";
import type { QuestionItem } from "../knowledge-engine/types";

export interface ExamBlueprint {
  domain_weights: Record<string, number>; // topic_id -> % of exam
  total_questions: number;
  time_limit_minutes: number;
}

export interface ExamSession {
  questions: QuestionItem[];
  time_limit_minutes: number;
  started_at: string;
}

export function generateExam(blueprint: ExamBlueprint): ExamSession {
  // TODO(implementation):
  // - select N questions per domain from questionEngine.generateQuestionSet()
  //   proportional to blueprint.domain_weights
  // - mix question TYPES per the 5 official formats
  // - enforce no-penalty-for-guessing in the UI layer (this engine just
  //   assembles the session; UI must never block skipping without an answer)
  throw new Error("Not implemented — Phase E");
}
