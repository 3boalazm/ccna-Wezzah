// Review Engine
// Spaced-repetition scheduling. Does NOT read Knowledge Engine directly —
// only stores attempt IDs + timing, and hands IDs back to the UI to re-fetch
// content. This keeps Review Engine content-agnostic.
//
// Algorithm (simple Leitner-style curve, per README Phase E guidance):
//   - Track a running "correct streak" per question_id, replayed from the
//     attempt history in chronological order.
//   - Interval (days) = 2 ^ streak, capped at 32 days.
//   - A question is "due" once now >= lastAttemptTime + interval.
//   - An incorrect answer resets the streak to 0 (interval back to 1 day).
//   - A question with zero attempts is never "due" (nothing to review yet).

import * as attemptLog from "../../services/attempt-log";
import type { AttemptRecord } from "../knowledge-engine/types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MAX_INTERVAL_DAYS = 32;

interface QuestionState {
  topicId: string;
  streak: number;
  lastAttemptAt: number; // epoch ms
}

export function recordAttempt(record: AttemptRecord): void {
  attemptLog.appendSync(record);
}

export function getDueReviews(userId: string): string[] {
  const history = attemptLog.getHistorySync(userId);
  const states = buildQuestionStates(history);

  const now = Date.now();
  const due: string[] = [];
  for (const [questionId, state] of states.entries()) {
    const intervalDays = Math.min(2 ** state.streak, MAX_INTERVAL_DAYS);
    const dueAt = state.lastAttemptAt + intervalDays * MS_PER_DAY;
    if (now >= dueAt) due.push(questionId);
  }
  // Stable order so the UI doesn't reshuffle between renders.
  return due.sort();
}

// Exposed for the Review Dashboard UI so it can show streak/interval per
// item, not just the bare "due" list.
export function getReviewForecast(userId: string): {
  question_id: string;
  topic_id: string;
  streak: number;
  interval_days: number;
  due_at: string;
  is_due: boolean;
}[] {
  const history = attemptLog.getHistorySync(userId);
  const states = buildQuestionStates(history);
  const now = Date.now();

  return [...states.entries()]
    .map(([questionId, state]) => {
      const intervalDays = Math.min(2 ** state.streak, MAX_INTERVAL_DAYS);
      const dueAt = state.lastAttemptAt + intervalDays * MS_PER_DAY;
      return {
        question_id: questionId,
        topic_id: state.topicId,
        streak: state.streak,
        interval_days: intervalDays,
        due_at: new Date(dueAt).toISOString(),
        is_due: now >= dueAt,
      };
    })
    .sort((a, b) => a.due_at.localeCompare(b.due_at));
}

function buildQuestionStates(history: AttemptRecord[]): Map<string, QuestionState> {
  // Chronological replay so streaks reflect the true attempt order, even if
  // the log wasn't appended in order for some reason.
  const sorted = [...history].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const states = new Map<string, QuestionState>();
  for (const attempt of sorted) {
    const prev = states.get(attempt.question_id);
    const streak = attempt.correct ? (prev?.streak ?? 0) + 1 : 0;
    states.set(attempt.question_id, {
      topicId: attempt.topic_id,
      streak,
      lastAttemptAt: new Date(attempt.timestamp).getTime(),
    });
  }
  return states;
}
