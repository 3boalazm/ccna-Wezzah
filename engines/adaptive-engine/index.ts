// Adaptive Engine
// Raises/lowers question difficulty per user based on rolling accuracy.
// Reads the SAME attempt log as Review Engine (shared data source) to avoid
// duplicate tracking systems.

import * as attemptLog from "../../services/attempt-log";
import type { Difficulty } from "../knowledge-engine/types";

const PROMOTE_THRESHOLD = 0.8; // >80% accuracy over recent window -> harder
const DEMOTE_THRESHOLD = 0.5;  // <50% accuracy -> easier

export function getDifficultyTarget(userId: string, topicId: string): Difficulty {
  // TODO(implementation):
  // const recent = attemptLog.getRecent(userId, topicId, N=10);
  // const accuracy = recent.filter(a => a.correct).length / recent.length;
  // if (accuracy > PROMOTE_THRESHOLD) return "Hard";
  // if (accuracy < DEMOTE_THRESHOLD) return "Easy";
  // return "Medium";
  throw new Error("Not implemented — Phase E");
}
