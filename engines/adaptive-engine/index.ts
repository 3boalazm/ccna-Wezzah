// Adaptive Engine
// Raises/lowers question difficulty per user based on rolling accuracy.
// Reads the SAME attempt log as Review Engine (shared data source) to avoid
// duplicate tracking systems. Uses the synchronous mirror in attempt-log.ts
// since this is called directly from render paths (Question Bank / Exam
// pages pick a target difficulty before generating a set).

import * as attemptLog from "../../services/attempt-log";
import type { Difficulty } from "../knowledge-engine/types";

const PROMOTE_THRESHOLD = 0.8; // >80% accuracy over recent window -> harder
const DEMOTE_THRESHOLD = 0.5; // <50% accuracy -> easier
const WINDOW = 10;
const MIN_SAMPLE = 4; // don't move off "Medium" on a tiny sample

export function getDifficultyTarget(userId: string, topicId: string): Difficulty {
  const recent = attemptLog.getRecentSync(userId, topicId, WINDOW);
  if (recent.length < MIN_SAMPLE) return "Medium"; // not enough signal yet

  const accuracy = recent.filter((a) => a.correct).length / recent.length;
  if (accuracy > PROMOTE_THRESHOLD) return "Hard";
  if (accuracy < DEMOTE_THRESHOLD) return "Easy";
  return "Medium";
}

// Exposed so the UI can show "why" a difficulty was chosen (sample size +
// accuracy), instead of just the bare label.
export function getDifficultySignal(
  userId: string,
  topicId: string
): { target: Difficulty; accuracy: number | null; sampleSize: number } {
  const recent = attemptLog.getRecentSync(userId, topicId, WINDOW);
  if (recent.length < MIN_SAMPLE) {
    return { target: "Medium", accuracy: null, sampleSize: recent.length };
  }
  const accuracy = recent.filter((a) => a.correct).length / recent.length;
  const target: Difficulty =
    accuracy > PROMOTE_THRESHOLD ? "Hard" : accuracy < DEMOTE_THRESHOLD ? "Easy" : "Medium";
  return { target, accuracy, sampleSize: recent.length };
}
