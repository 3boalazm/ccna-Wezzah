# Phase C — Application Layer: Engine Architecture

**Status:** Design only (no implementation yet, per project rules)
**Depends on:** Phase B (Knowledge Modules — NAT, OSPF, ACL, DHCP, DNS, SNMP, NTP, Syslog, Wireless, Security, Automation, IPv6, QoS, WAN, LAN, Cloud, SDN, SDA, DHCP Snooping/DAI, Port Security)

---

## 1. Knowledge Engine (Core — everything else reads from this)

**Responsibility:** Single source of truth. Stores every Knowledge Module as structured data (not prose files) so other engines can query fields programmatically.

**Data shape per topic (derived from the 25-section template already in use):**
```
{
  topic_id: "nat",
  path: ["CCNA", "NAT"],
  overview, definitions, core_concepts, protocol_operation, packet_flow,
  header_fields, default_values, port_numbers, timers, protocol_numbers,
  config_commands[], verification_commands[], show_commands[], debug_commands[],
  cli_examples[], config_examples[], troubleshooting[], best_practices[],
  security_notes, interview_questions[], exam_traps[], enterprise_notes,
  related_topics[], difficulty, keywords[], tags[]
}
```

**Interface exposed to other engines:**
- `getTopic(topic_id)` → full module
- `getField(topic_id, field)` → e.g. just `interview_questions` for topic "nat"
- `searchByTag(tag)` / `searchByKeyword(keyword)`
- `listRelated(topic_id)` → reads from `relations.json` (below)

**Migration task in this phase:** Convert the Markdown modules already built (NAT, OSPF, ACL, DHCP, DNS, SNMP, NTP, Syslog, Wireless, Security, Automation, IPv6, QoS, LAN/WAN/Cloud, SDN/SDA, Port Security, DHCP Snooping/DAI) into the JSON shape above. One file per topic under `/knowledge/*.json` as originally planned.

---

## 2. Question Engine

**Responsibility:** Given a topic, generates a question set that also pulls in *related* topics automatically — this is the "if VLAN, then also Trunk/Native VLAN/STP/EtherChannel/Port Security" requirement.

**How it decides what's related:** Reads `relations.json`, NOT hardcoded logic. This keeps the engine dumb and the knowledge graph editable without touching code.

**Core function:**
```
generateQuestionSet(topic_id, depth=1):
  core_topics = [topic_id] + relations[topic_id].direct (if depth>=1)
  for each topic in core_topics:
      pull "interview_questions" style facts + "config_commands" + "exam_traps"
      → convert into question formats (MCQ / fill-blank / command-completion)
  return mixed set, tagged by source topic
```

**Depends on:** Knowledge Engine (read-only), Adaptive Engine (to know difficulty target)

---

## 3. Interview Engine

**Responsibility:** Pulls only the `interview_questions` field across one or more topics, deliberately WITHOUT answers (matches the source material's own convention: "generate realistic interview questions, no answers").

**Core function:**
```
generateInterviewSet(topic_ids[]):
  return topics.flatMap(t => knowledgeEngine.getField(t, "interview_questions"))
```

**Note:** This engine is intentionally the simplest — it's a thin, read-only filter over the Knowledge Engine. No independent state.

---

## 4. Exam Engine

**Responsibility:** Simulates the real CCNA 200-301 exam format, as described in the Chapter 20 module: Multiple choice, Drag-and-drop, Simulation, Simlet, Testlet.

**Core function:**
```
generateExam(blueprint):
  # blueprint = weighted distribution across CCNA domains (matches Cisco's official exam topics %)
  select N questions per domain from Question Engine
  mix question TYPES (not just topics) per the 5 official formats
  enforce no-penalty-for-guessing rule (UI must never block skipping without an answer... but must warn before submit)
  return timed exam session object
```

**Depends on:** Question Engine (for content), not Knowledge Engine directly — keeps Exam Engine focused purely on exam *mechanics* (timing, format mix, scoring), not content curation.

---

## 5. Troubleshooting Engine

**Responsibility:** The multi-module scenario generator — the literal "VLAN + DHCP + ACL + NAT + OSPF" requirement. This is the most complex engine because it must generate a *coherent* fault, not just concatenate random topics.

**Design approach:** Rather than freely combining any topics, scenarios are built from **pre-defined scenario templates** seeded from the real troubleshooting chains already found in the source material — for example, the exact "branch office: OSPF over MPLS + NAT Overload + ACL" chain, or the "DHCP Snooping enabled → DAI can't function" chain. This avoids the engine inventing implausible combinations (e.g., "Wireless SSID conflict causes an ACL match-count error" wouldn't be coherent).

**Core function:**
```
generateScenario(template_id):
  template = scenarioTemplates[template_id]   # e.g. "branch_wan_no_server_access"
  topics_involved = template.topics            # [nat, ospf, acl]
  symptom = template.symptom_text
  expected_diagnostic_order = template.steps   # matches the real troubleshooting order from the source
  return { symptom, topics_involved, hidden_root_cause, step_by_step_solution }
```

**Seed data for this phase (already present in the merged Knowledge Base):**
- Branch OSPF+NAT+ACL connectivity chain
- DHCP Snooping + DAI failure chain
- OSPF MTU-mismatch / Timer-mismatch chains
- Port Security violation chain

---

## 6. Review Engine

**Responsibility:** Spaced-repetition scheduling. Tracks per-topic (or per-question) performance and decides what resurfaces and when.

**Core function:**
```
recordAttempt(user_id, question_id, correct: bool)
getDueReviews(user_id) → list of topic_ids/question_ids scheduled for today
  (uses a standard spaced-repetition curve — interval grows on correct, resets on incorrect)
```

**Depends on:** nothing except its own attempt-history store. Does NOT read Knowledge Engine directly — it only stores IDs and timing, and hands IDs back to the UI to re-fetch content.

---

## 7. Adaptive Engine

**Responsibility:** Raises/lowers question difficulty per user based on rolling accuracy, and feeds a "current difficulty target" to the Question Engine.

**Core function:**
```
updateDifficulty(user_id, topic_id, recent_accuracy):
  if accuracy > 80% over last N questions → increase difficulty tier
  if accuracy < 50% → decrease difficulty tier
getDifficultyTarget(user_id, topic_id) → "Easy" | "Medium" | "Hard"
```

**Depends on:** Review Engine's attempt history (shared data source — both engines read the same attempt log, avoiding duplicate tracking systems).

---

## Engine Dependency Graph (who calls whom)

```
Knowledge Engine  ← (read-only, everyone depends on this)
      ↑
      │
Question Engine ──uses relations.json──> (reads Knowledge Engine)
      ↑
      │
Interview Engine (thin filter, reads Knowledge Engine directly)
      │
Exam Engine ──consumes──> Question Engine (not Knowledge Engine directly)
      │
Troubleshooting Engine ──uses scenario templates──> (reads Knowledge Engine)
      │
Review Engine ──stores attempts──> (independent store)
      │
Adaptive Engine ──reads──> Review Engine's attempt log
      │
Question Engine ──reads difficulty target──> Adaptive Engine
```

**Key architectural decision:** Knowledge Engine is the only engine every other engine can read from directly. No engine writes back to it — content updates only happen through the Phase B extraction process, keeping content and application logic cleanly separated (matches your TOGAF instinct to separate the Business/Data layer from Application layer).

---

## Next artifact needed before implementation: `relations.json`

This is the topic-relationship graph the Question Engine and Troubleshooting Engine both depend on. Building this next.
