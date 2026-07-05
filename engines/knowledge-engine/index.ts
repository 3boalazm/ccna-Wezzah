// Knowledge Engine — public interface
// This is what every other engine and the UI import from. Never import
// loader.ts directly outside this folder — go through here.

import type { KnowledgeModule } from "./types";
import { getCachedTopic, getRelations, loadKnowledgeBase } from "./loader";

export async function init(): Promise<void> {
  await loadKnowledgeBase();
}

export function getTopic(topicId: string): KnowledgeModule {
  const topic = getCachedTopic(topicId);
  if (!topic) throw new Error(`Unknown topic_id: ${topicId}`);
  return topic;
}

export function getField<K extends keyof KnowledgeModule>(
  topicId: string,
  field: K
): KnowledgeModule[K] {
  return getTopic(topicId)[field];
}

export function listRelated(topicId: string): string[] {
  const relations = getRelations();
  return relations[topicId]?.direct ?? [];
}

// Deferred (Phase E): params underscore-prefixed to mark them intentionally
// unused until the body is implemented. The exported signature is unchanged.
export function searchByTag(_tag: string): KnowledgeModule[] {
  // TODO(implementation): iterate cache, filter by tags.includes(tag)
  throw new Error("Not implemented — Phase E");
}

export function searchByKeyword(_keyword: string): KnowledgeModule[] {
  // TODO(implementation): iterate cache, filter by keywords.includes(keyword)
  throw new Error("Not implemented — Phase E");
}
