# Phase D — Technology Architecture

**ArchiMate framing:** Phase C defined the Application Layer (the 7 Engines and their behavior). Phase D defines the Technology Layer that hosts them — the actual folder/file structure, state management strategy, and service boundaries. No business logic changes here; this is purely "where does Phase C's design physically live."

---

## 1. Top-level structure

```
/ccna-platform
├── /knowledge                  # Phase B output — data only, no logic
│   ├── ospf.json
│   ├── acl.json
│   ├── nat.json
│   ├── dhcp.json
│   ├── dhcp-snooping-dai.json
│   ├── dns.json
│   ├── snmp.json
│   ├── ntp.json
│   ├── syslog.json
│   ├── port-security.json
│   ├── wireless.json
│   ├── security.json
│   ├── automation.json
│   ├── sdn.json
│   ├── sda.json
│   ├── cloud.json
│   ├── qos.json
│   ├── lan-architecture.json
│   ├── wan-architecture.json
│   ├── ipv6.json
│   ├── fhrp.json
│   ├── routing-table.json
│   └── relations.json          # Phase C output — the topic graph
│
├── /engines                    # Phase C logic, one folder per engine
│   ├── /knowledge-engine
│   │   ├── index.ts             # getTopic, getField, searchByTag, listRelated
│   │   └── loader.ts             # reads /knowledge/*.json at boot
│   ├── /question-engine
│   │   └── index.ts
│   ├── /interview-engine
│   │   └── index.ts
│   ├── /exam-engine
│   │   ├── index.ts
│   │   └── blueprints/            # exam domain-weighting configs
│   ├── /troubleshooting-engine
│   │   ├── index.ts
│   │   └── scenario-templates/    # seeded from real chains (OSPF+NAT+ACL, DAI+Snooping...)
│   ├── /review-engine
│   │   └── index.ts
│   └── /adaptive-engine
│       └── index.ts
│
├── /services                   # cross-cutting technical concerns, NOT business logic
│   ├── storage.ts                # wraps window.storage (get/set/delete/list) if built as artifact,
│   │                              # or a real DB adapter if built as a full app
│   ├── attempt-log.ts             # shared store Review + Adaptive engines both read/write
│   └── auth.ts                    # if multi-user; stub for now
│
├── /state                      # UI-facing state management (thin layer over engines)
│   ├── useKnowledge.ts            # hook: wraps Knowledge Engine calls
│   ├── useQuizSession.ts          # hook: active quiz/exam session state
│   ├── useReviewQueue.ts          # hook: today's due reviews
│   └── useUserProgress.ts         # hook: aggregated stats for dashboard
│
├── /ui
│   ├── /components               # small reusable pieces (QuestionCard, CommandBlock, TrapBadge...)
│   ├── /pages
│   │   ├── TopicPage.tsx
│   │   ├── QuestionBankPage.tsx
│   │   ├── ScenarioSimulatorPage.tsx
│   │   ├── ExamPage.tsx
│   │   └── ReviewDashboardPage.tsx
│   └── /layout
│
└── /docs                       # architecture artifacts themselves (Phase A-D docs, ADRs)
```

---

## 2. State Management Strategy

**Decision:** No global state library needed at this scale (React Context + a handful of hooks is sufficient). Reasoning:

- **Knowledge data** is read-only after load → lives in a simple in-memory cache inside `knowledge-engine/loader.ts`, exposed via `useKnowledge()`. No need for Redux-style mutation tracking on data that never changes at runtime.
- **Quiz/Exam session state** (current question index, answers given, timer) is inherently local to one page/flow → `useQuizSession()` as a local Context, scoped to the Exam/QuestionBank pages only. Doesn't need to be global.
- **Review/Adaptive state** (attempt history, spaced-repetition schedule) is the only state that needs persistence across sessions → lives in `/services/attempt-log.ts`, backed by real storage (see below), and surfaced via `useReviewQueue()` / `useUserProgress()`.

This keeps state scoped to where it's actually needed (ArchiMate "application component" boundary = React hook boundary), rather than one monolithic store.

---

## 3. Services Layer — persistence decision

Two possible hosting contexts, and the services layer is written to be swappable between them:

| Context | Storage adapter |
|---|---|
| Built as a Claude Artifact (in-chat prototype) | `window.storage` (get/set/delete/list) — key pattern: `attempts:{user_id}:{topic_id}` |
| Built as a real standalone app | Any real DB (Postgres/SQLite) behind the same `attempt-log.ts` interface |

**Why this matters architecturally:** `/engines/review-engine` and `/engines/adaptive-engine` never talk to storage directly — they only call `services/attempt-log.ts`. This is the one seam that lets the whole platform move from "artifact prototype" to "real product" later without touching engine logic. This mirrors the NORA/TOGAF principle of isolating a swappable technology component behind a stable application-layer contract.

---

## 4. Naming/versioning convention for Knowledge JSON

Since Phase B content will keep growing (OSPF plus an enrichment addendum were already added after the initial 20-chapter pass), each knowledge JSON file carries a small header so the Knowledge Engine can report freshness/gaps to other engines:

```json
{
  "topic_id": "ospf",
  "source_docs": ["CCNA_Deep_Dive.pdf"],
  "last_updated": "2026-07-05",
  "completeness": "high",
  "gaps": []
}
```
`completeness` is one of `"high" | "partial" | "gap-flagged"`. `gaps` lists field names still marked "Not Covered" (e.g. `["default_values", "protocol_numbers"]`). This lets the UI — or you, reviewing content — filter "show me every topic still marked partial" without re-reading every file manually.

---

## 5. Open decision before implementation starts

The folder tree above assumes a small framework-based app (React + hooks + TypeScript). Two realistic paths from here:

1. **Stay as Claude Artifacts** — build each engine as a self-contained HTML/JS artifact (like the visualizer already built), with `window.storage` for persistence. Fastest to iterate on inside this chat, but each artifact is somewhat isolated (no shared npm-style imports between artifacts).
2. **Move to Claude Code / a real repo** — scaffold this exact folder structure as an actual Next.js or Vite project, with real file imports between engines. Slower to start, but this is the only path that lets the 7 engines genuinely import and call each other the way the dependency graph in Phase C describes.

Given the platform's complexity (7 interdependent engines, growing knowledge base, persistent user progress), a real repo is the more sound long-term choice — Claude Code would be a natural fit for scaffolding and iterating on this once you're ready to move past architecture into actual implementation.
