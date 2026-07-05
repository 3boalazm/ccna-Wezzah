// Knowledge Engine — loader
// Reads every /knowledge/*.json file at boot and caches in memory.
// This is the ONLY module allowed to touch the knowledge folder directly.
// Everything else (other engines, UI) goes through index.ts's exported functions.
//
// Uses Vite's import.meta.glob to statically discover and bundle the knowledge
// JSON at build time (eager = parsed and available synchronously after the glob).
// relations.json lives in the same folder but is a different shape, so it's
// pulled out of the glob and cached separately.

import type {
  KnowledgeModule,
  RelationsGraph,
  RelationEntry,
} from "./types";

let cache: Map<string, KnowledgeModule> | null = null;
let relationsCache: RelationsGraph | null = null;

// Vite replaces this at build time with a static map of { path -> module }.
// Each JSON module's parsed contents are on `.default`.
const jsonModules = import.meta.glob<{ default: unknown }>(
  "../../knowledge/*.json",
  { eager: true }
);

export async function loadKnowledgeBase(): Promise<void> {
  // Idempotent — init() may be called by more than one entry point.
  if (cache && relationsCache) return;

  const nextCache = new Map<string, KnowledgeModule>();
  let nextRelations: RelationsGraph | null = null;

  for (const [path, mod] of Object.entries(jsonModules)) {
    const data = mod.default;

    if (path.endsWith("relations.json")) {
      nextRelations = normalizeRelations(data as Record<string, unknown>);
      continue;
    }

    const module = data as KnowledgeModule;
    if (!module || typeof module.topic_id !== "string") {
      // Defensive: a malformed file shouldn't take down the whole load.
      console.warn(`[knowledge-loader] Skipping ${path}: missing topic_id`);
      continue;
    }
    nextCache.set(module.topic_id, module);
  }

  if (!nextRelations) {
    throw new Error(
      "[knowledge-loader] relations.json was not found in /knowledge"
    );
  }

  cache = nextCache;
  relationsCache = nextRelations;
}

// relations.json carries non-topic bookkeeping keys (_meta,
// _gaps_referenced_but_not_sourced). Strip those so callers only ever see
// real topic entries, and only keep well-formed { direct: [...] } records.
function normalizeRelations(raw: Record<string, unknown>): RelationsGraph {
  const graph: RelationsGraph = {};
  for (const [key, value] of Object.entries(raw)) {
    if (key.startsWith("_")) continue;
    const entry = value as Partial<RelationEntry>;
    if (entry && Array.isArray(entry.direct)) {
      graph[key] = {
        direct: entry.direct,
        reason: typeof entry.reason === "string" ? entry.reason : "",
      };
    }
  }
  return graph;
}

export function getCachedTopic(topicId: string): KnowledgeModule | undefined {
  if (!cache) throw new Error("Knowledge base not loaded — call loadKnowledgeBase() first");
  return cache.get(topicId);
}

export function getRelations(): RelationsGraph {
  if (!relationsCache) throw new Error("Relations graph not loaded");
  return relationsCache;
}
