// Question Engine
// Depends on: Knowledge Engine (read-only), Adaptive Engine (difficulty target)
// Does NOT hardcode topic relationships — always reads relations.json via
// knowledgeEngine.listRelated(), so the graph stays editable without code changes.
//
// Bilingual: pass lang="ar" to generate Arabic prompt scaffolding AND pull
// Arabic purposes/traps/interview-question text from the Knowledge Engine's
// localized topic (falls back to English per-field automatically wherever a
// translation is missing). CLI commands themselves are never translated —
// they're technical terms, identical in both languages.

import * as knowledgeEngine from "../knowledge-engine";
import type { QuestionItem, Difficulty, KnowledgeModule } from "../knowledge-engine/types";
import type { Lang } from "../../ui/i18n/LanguageContext";

export interface GenerateQuestionSetOptions {
  topicId: string;
  depth?: number;          // 0 = only this topic, 1 = include direct relations
  difficulty?: Difficulty; // if omitted, caller should fetch from Adaptive Engine
  lang?: Lang;              // defaults to "en"
}

const PROMPT_TEXT = {
  en: {
    enterCommand: (label: string, purpose: string) => `[${label}] Enter the IOS command that does the following: ${purpose}`,
    whichCommand: (label: string, purpose: string) => `[${label}] Which command does the following: ${purpose}`,
    whichTrap: (label: string) => `[${label}] Which of the following is a recognized exam trap / common mistake for this topic?`,
  },
  ar: {
    enterCommand: (label: string, purpose: string) => `[${label}] أدخل أمر IOS الذي يقوم بـ: ${purpose}`,
    whichCommand: (label: string, purpose: string) => `[${label}] أي أمر يقوم بـ: ${purpose}`,
    whichTrap: (label: string) => `[${label}] أي مما يلي يُعتبر فخًا معروفًا في الامتحان أو خطأ شائعًا في هذا الموضوع؟`,
  },
};

export function generateQuestionSet(opts: GenerateQuestionSetOptions): QuestionItem[] {
  const { topicId, depth = 1, difficulty, lang = "en" } = opts;

  // 1. Build the topic set: this topic + its DIRECT relations, read from
  //    relations.json (via listRelated) — never hardcoded here. depth 0 = just
  //    this topic. Drop any related topic whose module isn't loaded yet.
  const candidates = [topicId];
  if (depth >= 1) candidates.push(...knowledgeEngine.listRelated(topicId));
  const topicIds = uniq(candidates).filter(isLoaded);

  // 2. Resolve each topic through the localized (or English) merge ONCE,
  //    so every generator below reads the same already-localized module
  //    instead of re-fetching per field.
  const topics = new Map(topicIds.map((id) => [id, knowledgeEngine.getLocalizedTopic(id, lang)]));

  // 3. Generate questions per topic from four source fields.
  const items: QuestionItem[] = [];
  for (const [id, mod] of topics) {
    const label = topicLabel(mod);
    items.push(...commandCompletionQuestions(mod, label, lang));
    items.push(...commandMcqQuestions(mod, label, topics, lang));
    items.push(...trapMcqQuestions(mod, label, topics, lang));
    items.push(...interviewQuestions(mod, label));
    void id;
  }

  // 4. Optional difficulty filter. The Adaptive Engine will supply opts.difficulty
  //    later as a "current target"; until then, callers get the full spread.
  return difficulty ? items.filter((q) => q.difficulty === difficulty) : items;
}

// --- question generators (each reads ONE knowledge field) -------------------

// config_commands -> "recall the command" (free-entry completion).
function commandCompletionQuestions(mod: KnowledgeModule, label: string, lang: Lang): QuestionItem[] {
  return mod.config_commands.map((c, i) => ({
    id: `${mod.topic_id}-cmd-${i}`,
    source_topic: mod.topic_id,
    format: "command-completion" as const,
    prompt: PROMPT_TEXT[lang].enterCommand(label, c.purpose),
    correct_answer: c.command,
    difficulty: mod.difficulty,
  }));
}

// config_commands -> "recognize the command" MCQ, distractors = OTHER real
// commands drawn from the same topic set (so every option is a valid command).
function commandMcqQuestions(
  mod: KnowledgeModule,
  label: string,
  allTopics: Map<string, KnowledgeModule>,
  lang: Lang
): QuestionItem[] {
  const pool = [...allTopics.values()].flatMap((m) => m.config_commands).map((c) => c.command);

  return mod.config_commands.map((c, i) => {
    const distractors = pickDistractors(pool, c.command, 3, i);
    const options = assembleOptions(c.command, distractors, i);
    return {
      id: `${mod.topic_id}-cmdmcq-${i}`,
      source_topic: mod.topic_id,
      format: "mcq" as const,
      prompt: PROMPT_TEXT[lang].whichCommand(label, c.purpose),
      options,
      correct_answer: c.command,
      difficulty: tierDown(mod.difficulty),
    };
  });
}

// exam_traps -> MCQ. Distractors are real traps from the OTHER topics in the
// set (plausible-but-wrong: genuine traps, just for a different topic).
function trapMcqQuestions(
  mod: KnowledgeModule,
  label: string,
  allTopics: Map<string, KnowledgeModule>,
  lang: Lang
): QuestionItem[] {
  const crossPool = [...allTopics.entries()]
    .filter(([id]) => id !== mod.topic_id)
    .flatMap(([, m]) => m.exam_traps);
  // Fall back to same-topic traps only if there aren't enough cross-topic ones.
  const pool = crossPool.length >= 3 ? crossPool : [...crossPool, ...mod.exam_traps];

  return mod.exam_traps.map((trap, i) => {
    const distractors = pickDistractors(pool, trap, 3, i);
    const options = assembleOptions(trap, distractors, i);
    return {
      id: `${mod.topic_id}-trap-${i}`,
      source_topic: mod.topic_id,
      format: "mcq" as const,
      prompt: PROMPT_TEXT[lang].whichTrap(label),
      options,
      correct_answer: trap,
      difficulty: tierDown(mod.difficulty),
    };
  });
}

// interview_questions -> open recall prompts. Per the source convention these
// have NO answers, so we emit them answer-less (never fabricate a key). The
// Interview Engine is the canonical consumer; the Question Engine surfaces them
// as self-graded "reveal" items alongside the gradeable ones.
function interviewQuestions(mod: KnowledgeModule, label: string): QuestionItem[] {
  return mod.interview_questions.map((q, i) => ({
    id: `${mod.topic_id}-iq-${i}`,
    source_topic: mod.topic_id,
    format: "fill-blank" as const,
    prompt: `[${label}] ${q}`,
    difficulty: mod.difficulty,
  }));
}

// --- helpers ----------------------------------------------------------------

function isLoaded(topicId: string): boolean {
  try {
    knowledgeEngine.getTopic(topicId);
    return true;
  } catch {
    return false; // topic referenced in relations.json but no module yet
  }
}

function topicLabel(mod: KnowledgeModule): string {
  return mod.path.length ? mod.path[mod.path.length - 1] : mod.topic_id.toUpperCase();
}

function pickDistractors(pool: string[], correct: string, count: number, seed: number): string[] {
  const filtered = uniq(pool.filter((x) => x !== correct));
  if (filtered.length === 0) return [];
  const out: string[] = [];
  const take = Math.min(count, filtered.length);
  for (let k = 0; k < take; k++) {
    out.push(filtered[(seed + k) % filtered.length]);
  }
  return uniq(out);
}

// Put the correct answer among the distractors, then rotate so it isn't always
// in position 0 — deterministic (rotation by seed), no randomness.
function assembleOptions(correct: string, distractors: string[], seed: number): string[] {
  const opts = uniq([correct, ...distractors]);
  const rot = seed % opts.length;
  return opts.slice(rot).concat(opts.slice(0, rot));
}

function tierDown(d: Difficulty): Difficulty {
  return d === "Hard" ? "Medium" : d === "Medium" ? "Easy" : "Easy";
}

function uniq<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}
