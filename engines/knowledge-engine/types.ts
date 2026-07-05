// Shared type definitions — the contract every engine and the UI depend on.
// Keep this file as the single source of truth for shapes; engines should
// import from here rather than redefining shapes locally.

export type Difficulty = "Easy" | "Medium" | "Hard";
export type Completeness = "high" | "partial" | "gap-flagged";

export interface KnowledgeModule {
  topic_id: string;
  path: string[];                 // e.g. ["CCNA", "NAT"]
  source_docs: string[];
  last_updated: string;           // ISO date
  completeness: Completeness;
  gaps: string[];                 // field names still "Not Covered"

  overview: string;
  definitions: string[];
  core_concepts: string[];
  protocol_operation: string[];
  packet_flow: string;
  header_fields: string[];
  default_values: string[];
  port_numbers: string[];
  timers: string[];
  protocol_numbers: string[];
  config_commands: CommandExample[];
  verification_commands: CommandExample[];
  show_commands: CommandExample[];
  debug_commands: CommandExample[];
  cli_examples: CliExample[];
  config_examples: CliExample[];
  troubleshooting: TroubleshootingNote[];
  best_practices: string[];
  security_notes: string[];
  interview_questions: string[];   // deliberately no answers, per source convention
  exam_traps: string[];
  enterprise_notes: string[];
  related_topics: string[];        // topic_ids, cross-checked against relations.json
  difficulty: Difficulty;
  keywords: string[];
  tags: string[];
}

export interface CommandExample {
  command: string;
  purpose: string;
}

export interface CliExample {
  title: string;
  code: string;
  explanation?: string;
}

export interface TroubleshootingNote {
  symptom: string;
  cause: string;
  fix: string;
}

export interface RelationEntry {
  direct: string[];      // topic_ids
  reason: string;
}

export type RelationsGraph = Record<string, RelationEntry>;

export interface ScenarioTemplate {
  template_id: string;
  topics_involved: string[];       // topic_ids
  symptom_text: string;
  hidden_root_cause: string;
  expected_diagnostic_order: string[];
}

export interface QuestionItem {
  id: string;
  source_topic: string;
  format: "mcq" | "fill-blank" | "command-completion" | "drag-drop" | "simlet" | "testlet";
  prompt: string;
  options?: string[];
  correct_answer?: string;
  difficulty: Difficulty;
}

export interface AttemptRecord {
  user_id: string;
  question_id: string;
  topic_id: string;
  correct: boolean;
  timestamp: string;
}
