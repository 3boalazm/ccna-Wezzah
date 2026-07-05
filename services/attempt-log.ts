// services/attempt-log.ts
// The ONE persistence seam that Review Engine and Adaptive Engine both go
// through. Neither engine talks to storage.ts directly — everything routes
// here, so swapping the storage backend (artifact window.storage <-> real DB)
// never requires touching engine logic.

import * as storage from "./storage";
import type { AttemptRecord } from "../engines/knowledge-engine/types";

const keyFor = (userId: string) => `attempts:${userId}`;

export async function append(record: AttemptRecord): Promise<void> {
  const key = keyFor(record.user_id);
  const existing = (await storage.get<AttemptRecord[]>(key)) ?? [];
  existing.push(record);
  await storage.set(key, existing);
}

export async function getHistory(userId: string): Promise<AttemptRecord[]> {
  return (await storage.get<AttemptRecord[]>(keyFor(userId))) ?? [];
}

export async function getRecent(
  userId: string,
  topicId: string,
  n: number
): Promise<AttemptRecord[]> {
  const all = await getHistory(userId);
  return all.filter((a) => a.topic_id === topicId).slice(-n);
}
