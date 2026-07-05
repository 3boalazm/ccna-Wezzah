// Question Engine
// Depends on: Knowledge Engine (read-only), Adaptive Engine (difficulty target)
// Does NOT hardcode topic relationships — always reads relations.json via
// knowledgeEngine.listRelated(), so the graph stays editable without code changes.

import * as knowledgeEngine from "../knowledge-engine";
import type { QuestionItem, Difficulty } from "../knowledge-engine/types";

export interface GenerateQuestionSetOptions {
  topicId: string;
  depth?: number;          // 0 = only this topic, 1 = include direct relations
  difficulty?: Difficulty; // if omitted, caller should fetch from Adaptive Engine
}

export function generateQuestionSet(opts: GenerateQuestionSetOptions): QuestionItem[] {
  const { topicId, depth = 1, difficulty } = opts;

  // 1. Build the topic set: this topic + its DIRECT relations, read from
  //    relations.json (via listRelated) — never hardcoded here. depth 0 = just
  //    this topic. Drop any related topic whose module isn't loaded yet
  //    (relations.json references topics like dhcp/wan_architecture that have
  //    no JSON module yet), so the engine degrades gracefully.
  const candidates = [topicId];
  if (depth >= 1) candidates.push(...knowledgeEngine.listRelated(topicId));
  const topics = uniq(candidates).filter(isLoaded);

  // 2. Generate questions per topic from three source fields.
  const items: QuestionItem[] = [];
  for (const topic of topics) {
    const moduleDifficulty = knowledgeEngine.getField(topic, "difficulty");
    const label = topicLabel(topic);

    items.push(...commandCompletionQuestions(topic, label, moduleDifficulty));
    items.push(...commandMcqQuestions(topic, label, topics, moduleDifficulty));
    items.push(...trapMcqQuestions(topic, label, topics, moduleDifficulty));
    items.push(...interviewQuestions(topic, label, moduleDifficulty));
  }

  // 3. Optional difficulty filter. The Adaptive Engine will supply opts.difficulty
  //    later as a "current target"; until then, callers get the full spread.
  return difficulty ? items.filter((q) => q.difficulty === difficulty) : items;
}

// --- question generators (each reads ONE knowledge field) -------------------

// config_commands -> "recall the command" (free-entry completion).
function commandCompletionQuestions(
  topic: string,
  label: string,
  difficulty: Difficulty
): QuestionItem[] {
  const commands = knowledgeEngine.getField(topic, "config_commands");
  return commands.map((c, i) => ({
    id: `${topic}-cmd-${i}`,
    source_topic: topic,
    format: "command-completion" as const,
    prompt: `[${label}] Enter the IOS command that does the following: ${c.purpose}`,
    correct_answer: c.command,
    difficulty, // recall is at the module's own difficulty
  }));
}

// config_commands -> "recognize the command" MCQ, distractors = OTHER real
// commands drawn from the same topic set (so every option is a valid command).
function commandMcqQuestions(
  topic: string,
  label: string,
  allTopics: string[],
  difficulty: Difficulty
): QuestionItem[] {
  const commands = knowledgeEngine.getField(topic, "config_commands");
  const pool = allTopics
    .flatMap((t) => knowledgeEngine.getField(t, "config_commands"))
    .map((c) => c.command);

  return commands.map((c, i) => {
    const distractors = pickDistractors(pool, c.command, 3, i);
    const options = assembleOptions(c.command, distractors, i);
    return {
      id: `${topic}-cmdmcq-${i}`,
      source_topic: topic,
      format: "mcq" as const,
      prompt: `[${label}] Which command does the following: ${c.purpose}`,
      options,
      correct_answer: c.command,
      difficulty: tierDown(difficulty), // recognition easier than free recall
    };
  });
}

// exam_traps -> MCQ. Distractors are real traps from the OTHER topics in the
// set (plausible-but-wrong: genuine traps, just for a different topic).
function trapMcqQuestions(
  topic: string,
  label: string,
  allTopics: string[],
  difficulty: Difficulty
): QuestionItem[] {
  const traps = knowledgeEngine.getField(topic, "exam_traps");
  const crossPool = allTopics
    .filter((t) => t !== topic)
    .flatMap((t) => knowledgeEngine.getField(t, "exam_traps"));
  // Fall back to same-topic traps only if there aren't enough cross-topic ones.
  const pool = crossPool.length >= 3 ? crossPool : [...crossPool, ...traps];

  return traps.map((trap, i) => {
    const distractors = pickDistractors(pool, trap, 3, i);
    const options = assembleOptions(trap, distractors, i);
    return {
      id: `${topic}-trap-${i}`,
      source_topic: topic,
      format: "mcq" as const,
      prompt: `[${label}] Which of the following is a recognized exam trap / common mistake for this topic?`,
      options,
      correct_answer: trap,
      difficulty: tierDown(difficulty),
    };
  });
}

// interview_questions -> open recall prompts. Per the source convention these
// have NO answers, so we emit them answer-less (never fabricate a key). The
// Interview Engine is the canonical consumer; the Question Engine surfaces them
// as self-graded "reveal" items alongside the gradeable ones.
function interviewQuestions(
  topic: string,
  label: string,
  difficulty: Difficulty
): QuestionItem[] {
  const questions = knowledgeEngine.getField(topic, "interview_questions");
  return questions.map((q, i) => ({
    id: `${topic}-iq-${i}`,
    source_topic: topic,
    format: "fill-blank" as const,
    prompt: `[${label}] ${q}`,
    difficulty,
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

function topicLabel(topicId: string): string {
  const path = knowledgeEngine.getField(topicId, "path");
  return path.length ? path[path.length - 1] : topicId.toUpperCase();
}

function pickDistractors(
  pool: string[],
  correct: string,
  count: number,
  seed: number
): string[] {
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
function assembleOptions(
  correct: string,
  distractors: string[],
  seed: number
): string[] {
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
