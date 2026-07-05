# CCNA Adaptive Learning Platform — Scaffold

This is the Phase D Technology Architecture scaffold, generated from the
Phase A-D design work (see `/docs`). It contains **structure and contracts
only** — no working implementation yet. That's Phase E.

## What's actually here

- `/knowledge` — `relations.json` (the topic graph) is real and complete.
  `nat.json` is a fully populated example showing the exact JSON contract
  every other knowledge module should follow. The other ~20 topics (OSPF,
  ACL, DHCP, DNS, SNMP, NTP, Syslog, Port Security, Wireless, Security,
  Automation, SDN, SDA, Cloud, QoS, LAN/WAN Architecture, IPv6, FHRP,
  Routing Table, DHCP Snooping/DAI) exist as full Markdown content in the
  chat history / outputs — they still need to be converted into this same
  JSON shape. That conversion is a Phase E task.

- `/engines/*/index.ts` — every engine's public interface is written with
  real function signatures and full JSDoc-style comments explaining what
  each one does and depends on, but the bodies `throw new Error("Not
  implemented — Phase E")`. This is intentional: the CONTRACT is locked,
  the IMPLEMENTATION is next.

- `/engines/troubleshooting-engine/scenario-templates/` — 4 real seed
  scenarios, taken directly from the source material's own worked
  examples (branch WAN/NAT/ACL chain, DHCP Snooping/DAI failure, OSPF
  MTU-mismatch, Port Security err-disable).

- `/services/storage.ts` — the swappable persistence seam. Not yet wired
  to either `window.storage` (if this stays artifact-based) or a real DB.

- `/state/*.ts` — three React hooks (`useKnowledge`, `useQuizSession`,
  `useReviewQueue`) with working logic where trivial, throwing where they
  depend on unimplemented engine methods.

## Suggested Phase E order (smallest coherent slice first)

1. Implement `services/storage.ts` (pick artifact vs. real DB backend).
2. Implement `knowledge-engine/loader.ts` to actually read `/knowledge/*.json`.
3. Convert 2-3 more topics (start with OSPF and ACL, since they're the
   most cross-referenced in `relations.json`) into the `nat.json` shape.
4. Implement `question-engine` against just those 3 topics end-to-end.
5. Wire up `TopicPage.tsx` to render one real topic via `useKnowledge`.
6. Only then move to Exam/Troubleshooting/Review/Adaptive engines.

## Running this in Claude Code

This scaffold has no `vite.config.ts`, `tsconfig.json`, or entry point yet
— add those as part of Phase E setup, or ask Claude Code to scaffold a
standard Vite+React+TS app around these existing folders.
