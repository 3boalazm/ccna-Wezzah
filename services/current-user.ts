// services/current-user.ts
// This app has no auth layer (single-learner, local-first tool), but the
// engines' contracts are keyed by user_id (AttemptRecord, Review/Adaptive
// Engine). Rather than hardcode "guest" everywhere, generate a stable
// per-browser id once and reuse it — keeps the contract honest without
// building real auth for a Phase E slice that doesn't need it.

const KEY = "ccna-platform:user-id";

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getCurrentUserId(): string {
  if (typeof window === "undefined" || !window.localStorage) return "local-learner";
  const existing = window.localStorage.getItem(KEY);
  if (existing) return existing;
  const id = generateId();
  window.localStorage.setItem(KEY, id);
  return id;
}
