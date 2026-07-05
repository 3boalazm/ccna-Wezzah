// Knowledge Engine — public interface
// This is what every other engine and the UI import from. Never import
// loader.ts directly outside this folder — go through here.

import type { KnowledgeModule } from "./types";
import { getAllCachedTopics, getCachedTopic, getRelations, loadKnowledgeBase } from "./loader";
import { getLocalizedTopic as localize } from "./localization";

export async function init(): Promise<void> {
  await loadKnowledgeBase();
}

export function getTopic(topicId: string): KnowledgeModule {
  const topic = getCachedTopic(topicId);
  if (!topic) throw new Error(`Unknown topic_id: ${topicId}`);
  return topic;
}

// Arabic-content-aware variant. lang="en" (or a topic with no Arabic
// overlay yet) returns the exact same object as getTopic() — this is a
// pure content overlay, not a second copy of the engine's logic.
export function getLocalizedTopic(topicId: string, lang: "ar" | "en"): KnowledgeModule {
  return localize(getTopic(topicId), lang);
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

export function searchByTag(tag: string): KnowledgeModule[] {
  const needle = tag.trim().toLowerCase();
  return getAllCachedTopics().filter((m) => m.tags.some((t) => t.toLowerCase() === needle));
}

export function searchByKeyword(keyword: string): KnowledgeModule[] {
  const needle = keyword.trim().toLowerCase();
  return getAllCachedTopics().filter((m) =>
    m.keywords.some((k) => k.toLowerCase().includes(needle))
  );
}

// Free-text search across overview + keywords + tags — used by the
// Sidebar's search box so it can match on content, not just topic_id.
export function searchByText(query: string): KnowledgeModule[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return getAllCachedTopics();
  return getAllCachedTopics().filter((m) => {
    const haystack = [m.topic_id, m.overview, ...m.keywords, ...m.tags]
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });
}

export function listAllTopicIds(): string[] {
  return getAllCachedTopics().map((m) => m.topic_id);
}
