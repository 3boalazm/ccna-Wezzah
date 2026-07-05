// Interview Engine
// Intentionally the simplest engine — a thin, read-only filter over the
// Knowledge Engine. No independent state. Deliberately returns questions
// WITHOUT answers, matching the source material's own convention.

import * as knowledgeEngine from "../knowledge-engine";

export function generateInterviewSet(topicIds: string[]): string[] {
  return topicIds.flatMap((t) => knowledgeEngine.getField(t, "interview_questions"));
}
