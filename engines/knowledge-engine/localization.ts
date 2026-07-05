// engines/knowledge-engine/localization.ts
// Arabic content overlay. The base /knowledge/*.json files (loaded by
// loader.ts) stay English and remain the single source of truth for
// structural/technical fields — topic_id, keywords, tags, difficulty,
// completeness, gaps, related_topics, source_docs, config_commands[].command
// (literal CLI syntax), port_numbers/header_fields/default_values/timers/
// protocol_numbers (compact spec-sheet facts) never get translated; they're
// terminology, not prose, per the "translate everything except terms"
// instruction.
//
// This module holds ONLY the narrative-prose Arabic translations, keyed by
// topic_id, with array fields matching the English base's array length and
// order exactly so they zip together positionally. getLocalizedTopic()
// merges the two; missing overlay fields (or a missing overlay file
// entirely) fall back to the English original rather than rendering blank.

import type { KnowledgeModule, CommandExample, CliExample, TroubleshootingNote } from "./types";

export interface TopicTranslation {
  path?: string[];
  overview?: string;
  definitions?: string[];
  core_concepts?: string[];
  protocol_operation?: string[];
  packet_flow?: string;
  troubleshooting?: TroubleshootingNote[];
  best_practices?: string[];
  security_notes?: string[];
  interview_questions?: string[];
  exam_traps?: string[];
  enterprise_notes?: string[];
  config_commands_purpose?: string[];
  verification_commands_purpose?: string[];
  show_commands_purpose?: string[];
  cli_examples?: { title?: string; explanation?: string }[];
  config_examples_title?: string[];
}

const arModules = import.meta.glob<{ default: TopicTranslation }>("./i18n/ar/*.json", { eager: true });

let arCache: Map<string, TopicTranslation> | null = null;

function loadAr(): Map<string, TopicTranslation> {
  if (arCache) return arCache;
  const map = new Map<string, TopicTranslation>();
  for (const [path, mod] of Object.entries(arModules)) {
    const topicId = path.split("/").pop()?.replace(/\.json$/, "");
    if (topicId) map.set(topicId, mod.default);
  }
  arCache = map;
  return map;
}

function mergeCommands(base: CommandExample[], purposes?: string[]): CommandExample[] {
  if (!purposes) return base;
  return base.map((c, i) => (purposes[i] ? { ...c, purpose: purposes[i] } : c));
}

function mergeCliExamples(base: CliExample[], overlay?: { title?: string; explanation?: string }[]): CliExample[] {
  if (!overlay) return base;
  return base.map((ex, i) => ({
    ...ex,
    title: overlay[i]?.title ?? ex.title,
    explanation: overlay[i]?.explanation ?? ex.explanation,
  }));
}

function mergeTroubleshooting(base: TroubleshootingNote[], overlay?: TroubleshootingNote[]): TroubleshootingNote[] {
  if (!overlay) return base;
  return base.map((note, i) => (overlay[i] ? { ...note, ...overlay[i] } : note));
}

export function getLocalizedTopic(base: KnowledgeModule, lang: "ar" | "en"): KnowledgeModule {
  if (lang === "en") return base;
  const tr = loadAr().get(base.topic_id);
  if (!tr) return base;

  return {
    ...base,
    path: tr.path ?? base.path,
    overview: tr.overview ?? base.overview,
    definitions: tr.definitions ?? base.definitions,
    core_concepts: tr.core_concepts ?? base.core_concepts,
    protocol_operation: tr.protocol_operation ?? base.protocol_operation,
    packet_flow: tr.packet_flow ?? base.packet_flow,
    troubleshooting: mergeTroubleshooting(base.troubleshooting, tr.troubleshooting),
    best_practices: tr.best_practices ?? base.best_practices,
    security_notes: tr.security_notes ?? base.security_notes,
    interview_questions: tr.interview_questions ?? base.interview_questions,
    exam_traps: tr.exam_traps ?? base.exam_traps,
    enterprise_notes: tr.enterprise_notes ?? base.enterprise_notes,
    config_commands: mergeCommands(base.config_commands, tr.config_commands_purpose),
    verification_commands: mergeCommands(base.verification_commands, tr.verification_commands_purpose),
    show_commands: mergeCommands(base.show_commands, tr.show_commands_purpose),
    cli_examples: mergeCliExamples(base.cli_examples, tr.cli_examples),
    config_examples: base.config_examples.map((ex, i) =>
      tr.config_examples_title?.[i] ? { ...ex, title: tr.config_examples_title[i] } : ex
    ),
  };
}

export function hasTranslation(topicId: string): boolean {
  return loadAr().has(topicId);
}
