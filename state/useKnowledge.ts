// state/useKnowledge.ts
// Thin UI-facing wrapper over the Knowledge Engine. Knowledge data is
// read-only after load, so this is a simple hook — no Redux-style store needed.

import { useEffect, useState } from "react";
import * as knowledgeEngine from "../engines/knowledge-engine";
import type { KnowledgeModule } from "../engines/knowledge-engine/types";

export function useKnowledge(topicId: string) {
  const [topic, setTopic] = useState<KnowledgeModule | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      setTopic(knowledgeEngine.getTopic(topicId));
    } catch (e) {
      setError(e as Error);
    }
  }, [topicId]);

  return { topic, error };
}
