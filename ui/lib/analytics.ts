// ui/lib/analytics.ts
// Small read-only aggregations over the attempt log, shared by DashboardPage
// and ReviewPage so both surfaces agree on what "mastery" and "recent
// activity" mean. Reads the same synchronous attempt-log mirror the Review
// and Adaptive Engines use — this is presentation-layer math, not a new
// engine, so it lives under ui/ rather than engines/.

import * as attemptLog from "../../services/attempt-log";
import { domainOf, DOMAIN_LABELS, type Domain } from "../layout/domains";
import type { AttemptRecord } from "../../engines/knowledge-engine/types";

export interface DomainMastery {
  domain: Domain;
  label: string;
  score: number; // 0-100, average accuracy across attempts in this domain
  attempts: number;
}

export function getOverallAccuracy(userId: string): number | null {
  const history = attemptLog.getHistorySync(userId);
  if (history.length === 0) return null;
  const correct = history.filter((a) => a.correct).length;
  return Math.round((correct / history.length) * 100);
}

export function getDomainMastery(userId: string): DomainMastery[] {
  const history = attemptLog.getHistorySync(userId);
  const buckets = new Map<Domain, { correct: number; total: number }>();

  for (const a of history) {
    const d = domainOf(a.topic_id);
    const entry = buckets.get(d) ?? { correct: 0, total: 0 };
    entry.total += 1;
    if (a.correct) entry.correct += 1;
    buckets.set(d, entry);
  }

  return [...buckets.entries()]
    .map(([domain, { correct, total }]) => ({
      domain,
      label: DOMAIN_LABELS[domain],
      score: total ? Math.round((correct / total) * 100) : 0,
      attempts: total,
    }))
    .sort((a, b) => b.attempts - a.attempts);
}

export function getRecentActivity(userId: string, limit = 6): AttemptRecord[] {
  const history = attemptLog.getHistorySync(userId);
  return [...history]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

export function getTopicsEngaged(userId: string): Set<string> {
  const history = attemptLog.getHistorySync(userId);
  return new Set(history.map((a) => a.topic_id));
}

export interface RelativeTime {
  unit: "now" | "m" | "h" | "d";
  n: number;
}

export function relativeTime(iso: string): RelativeTime {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return { unit: "now", n: 0 };
  if (mins < 60) return { unit: "m", n: mins };
  const hours = Math.round(mins / 60);
  if (hours < 24) return { unit: "h", n: hours };
  const days = Math.round(hours / 24);
  return { unit: "d", n: days };
}
