// Review Engine
// Spaced-repetition scheduling. Does NOT read Knowledge Engine directly —
// only stores attempt IDs + timing, and hands IDs back to the UI to re-fetch
// content. This keeps Review Engine content-agnostic.

import * as attemptLog from "../../services/attempt-log";
import type { AttemptRecord } from "../knowledge-engine/types";

export function recordAttempt(record: AttemptRecord): void {
  attemptLog.append(record);
}

export function getDueReviews(userId: string): string[] {
  // TODO(implementation): standard spaced-repetition curve —
  // interval grows on correct, resets on incorrect. Return topic_ids/question_ids
  // scheduled for today based on attemptLog.getHistory(userId).
  throw new Error("Not implemented — Phase E");
}
