// Exam Engine
// Simulates the real CCNA 200-301 exam format: Multiple choice, Drag-and-drop,
// Simulation, Simlet, Testlet (per the Chapter 20 module).
// Depends on Question Engine for CONTENT, never Knowledge Engine directly —
// this keeps Exam Engine focused purely on exam MECHANICS (timing, format
// mix, scoring), not content curation.

import * as questionEngine from "../question-engine";
import * as knowledgeEngine from "../knowledge-engine";
import type { QuestionItem } from "../knowledge-engine/types";
import type { Lang } from "../../ui/i18n/LanguageContext";
import defaultBlueprintJson from "./blueprints/default.json";

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

export const defaultBlueprint: ExamBlueprint = defaultBlueprintJson as ExamBlueprint;

export function generateExam(blueprint: ExamBlueprint, lang: Lang = "en"): ExamSession {
  // 1. Only weight topics whose knowledge module is actually loaded — a
  //    blueprint may reference topics that don't have source content yet
  //    (mirrors how question-engine degrades gracefully for relations.json).
  const loadedWeights = Object.entries(blueprint.domain_weights).filter(([topicId]) =>
    isLoaded(topicId)
  );
  if (loadedWeights.length === 0) {
    throw new Error("No blueprint domains match a loaded knowledge module");
  }

  // 2. Renormalize weights across only the loaded topics, so the exam still
  //    totals blueprint.total_questions even if some domains are missing.
  const weightSum = loadedWeights.reduce((sum, [, w]) => sum + w, 0);

  // 3. Pull each domain's full question pool (depth 0 — exam mechanics pick
  //    the domain mix explicitly, so we don't want Question Engine silently
  //    pulling in a related topic's questions on top of that).
  const selected: QuestionItem[] = [];
  const seen = new Set<string>();

  for (const [topicId, weight] of loadedWeights) {
    const share = weight / weightSum;
    const quota = Math.max(1, Math.round(blueprint.total_questions * share));
    const pool = shuffle(
      questionEngine.generateQuestionSet({ topicId, depth: 0, lang }),
      hashSeed(topicId)
    );

    for (const q of pool) {
      if (selected.length >= blueprint.total_questions) break;
      if (seen.has(q.id)) continue;
      seen.add(q.id);
      selected.push(q);
      if (selected.filter((s) => s.source_topic === topicId).length >= quota) break;
    }
  }

  // 4. If domain quotas under-filled the exam (small knowledge base), top up
  //    from the remaining pool across all loaded domains rather than hand
  //    back a short exam.
  if (selected.length < blueprint.total_questions) {
    for (const [topicId] of loadedWeights) {
      const pool = questionEngine.generateQuestionSet({ topicId, depth: 0, lang });
      for (const q of pool) {
        if (selected.length >= blueprint.total_questions) break;
        if (seen.has(q.id)) continue;
        seen.add(q.id);
        selected.push(q);
      }
      if (selected.length >= blueprint.total_questions) break;
    }
  }

  return {
    questions: selected.slice(0, blueprint.total_questions),
    time_limit_minutes: blueprint.time_limit_minutes,
    started_at: new Date().toISOString(),
  };
}

// --- helpers ----------------------------------------------------------------

function isLoaded(topicId: string): boolean {
  try {
    knowledgeEngine.getTopic(topicId);
    return true;
  } catch {
    return false;
  }
}

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Deterministic shuffle (seeded) — no Math.random(), so exam generation is
// stable/reproducible for a given blueprint + topic, matching the rest of
// the codebase's "no randomness" convention (question-engine uses rotation,
// not Math.random, for the same reason).
function shuffle<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  let s = seed || 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
