// services/storage.ts
// Swappable storage adapter. Phase E decision: standalone app, backed by
// browser localStorage (see Phase D doc, section 3).
//
// This is the ONE technology seam. attempt-log.ts (and nothing else) calls
// get/set/delete/list here — it never knows the backend is localStorage.
// To move to a real DB later (Postgres/SQLite behind an API), reimplement
// ONLY the four functions below to fetch() a backend; no engine or
// attempt-log change is required. Keys follow the pattern `attempts:{user_id}`.
//
// Values are JSON-serialised on write and parsed on read, so callers store
// and retrieve plain objects/arrays, not strings.

// Guard so this module is safe to import in a non-browser context (e.g. a
// future SSR/test runner) — it degrades to an in-memory map instead of crashing.
const memoryFallback = new Map<string, string>();

function backend(): {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  keys(): string[];
} {
  if (typeof window !== "undefined" && window.localStorage) {
    const ls = window.localStorage;
    return {
      getItem: (k) => ls.getItem(k),
      setItem: (k, v) => ls.setItem(k, v),
      removeItem: (k) => ls.removeItem(k),
      keys: () => {
        const out: string[] = [];
        for (let i = 0; i < ls.length; i++) {
          const k = ls.key(i);
          if (k !== null) out.push(k);
        }
        return out;
      },
    };
  }
  return {
    getItem: (k) => (memoryFallback.has(k) ? memoryFallback.get(k)! : null),
    setItem: (k, v) => void memoryFallback.set(k, v),
    removeItem: (k) => void memoryFallback.delete(k),
    keys: () => [...memoryFallback.keys()],
  };
}

export async function get<T>(key: string): Promise<T | null> {
  const raw = backend().getItem(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    // Corrupt/legacy value — treat as absent rather than throwing.
    return null;
  }
}

export async function set<T>(key: string, value: T): Promise<void> {
  backend().setItem(key, JSON.stringify(value));
}

export async function del(key: string): Promise<void> {
  backend().removeItem(key);
}

export async function list(prefix?: string): Promise<string[]> {
  const all = backend().keys();
  return prefix ? all.filter((k) => k.startsWith(prefix)) : all;
}
