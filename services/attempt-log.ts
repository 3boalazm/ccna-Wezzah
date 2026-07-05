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

// --- synchronous mirror ------------------------------------------------
// Review Engine and Adaptive Engine are called synchronously from React
// hooks (no await at the call site), so they need a synchronous read/write
// path. localStorage itself is synchronous under the hood — storage.ts only
// wraps it in a Promise for backend-swap flexibility — so it's safe to talk
// to the same keys directly here without going through that async wrapper.
// Both paths read/write the exact same `attempts:{user_id}` keys, so data
// stays consistent regardless of which path a caller uses.

function rawGet(key: string): AttemptRecord[] {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as AttemptRecord[]) : [];
    }
  } catch {
    // corrupt value or storage unavailable — treat as empty
  }
  return [];
}

function rawSet(key: string, value: AttemptRecord[]): void {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    // storage unavailable (e.g. private mode quota) — drop silently rather
    // than crash the UI; attempts just won't persist this session.
  }
}

export function appendSync(record: AttemptRecord): void {
  const key = keyFor(record.user_id);
  const existing = rawGet(key);
  existing.push(record);
  rawSet(key, existing);
}

export function getHistorySync(userId: string): AttemptRecord[] {
  return rawGet(keyFor(userId));
}

export function getRecentSync(userId: string, topicId: string, n: number): AttemptRecord[] {
  return getHistorySync(userId).filter((a) => a.topic_id === topicId).slice(-n);
}
