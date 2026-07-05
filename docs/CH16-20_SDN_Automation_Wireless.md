# Knowledge Modules: Chapters 16–20 + Wireless

---

# Module: Controller-Based Networking / SDN (Chapter 16)
**Path:** CCNA → Automation → SDN

## Overview
Separates traditional device functions into three distinct planes and centralizes control-plane intelligence in an external controller.

## Core Concepts — The Three Planes
1. **Data Plane:** message forwarding — de-encapsulation, re-encapsulation, table matching (frame/packet forwarding itself).
2. **Control Plane:** information creation — routing protocols (OSPF), ARP, STP, MAC learning. In SDN, this is often moved to a **centralized controller**.
3. **Management Plane:** device control and access — SSH, SNMP, Syslog.

## SDN API Architecture
- **Southbound Interface (SBI):** controller ↔ devices (OpenFlow, OpFlex, CLI, SNMP, NETCONF).
- **Northbound Interface (NBI):** controller ↔ applications (REST APIs, Java API) — usually REST-based.

## Cisco Design Recommendation — Spine-Leaf (Clos) Topology
- Every Leaf switch connects to every Spine switch.
- Leaf switches never connect directly to each other.
- Modern standard topology for data centers.

## Configuration / Verification / Show / Debug Commands
Not covered — architectural/conceptual chapter, no CLI syntax provided.

## Troubleshooting
Not covered directly in source.

## Comparison Table — Traditional vs Controller-Based Networking
| Aspect | Traditional | Controller-Based (SDN) |
|---|---|---|
| Control Plane | Distributed, per-device | Centralized in controller |
| Configuration | Manual, per-device (CLI) | Programmatic, via NBI/API |
| Visibility | Per-device | Network-wide, single pane of glass |

## Interview Questions
- Explain the three planes and what moves to the controller in SDN.
- Difference between Southbound and Northbound interfaces?
- Why is Spine-Leaf preferred over traditional 3-tier for data centers?

## Exam Traps
- Confusing SBI (controller-to-device) with NBI (controller-to-app) direction.
- Assuming leaf switches connect to each other in Spine-Leaf — they never do.

## Enterprise Notes
Not covered beyond the SDN architecture description.

## Related Topics
Cisco SDA (Ch17), REST/JSON (Ch18), Ansible/Automation (Ch19).

## Difficulty Level
Medium

## Keywords
Data Plane, Control Plane, Management Plane, SBI, NBI, Spine-Leaf

## Tags
`#SDN` `#ControllerBased` `#CCNA-Chapter16`

---

# Module: Cisco Software-Defined Access — SDA (Chapter 17)
**Path:** CCNA → Automation → SDN

## Overview
Cisco's SDN-based solution for campus (enterprise) networks, unifying wired and wireless management through a central controller (DNA Center).

## Core Concepts
- **Underlay:** the physical network (routers/switches, typically routed access with L3 switches) providing basic connectivity.
- **Overlay:** VXLAN tunnels carrying user/endpoint data across the underlay.
- **Fabric:** the combination of Underlay + Overlay.
- **Control Plane Protocol:** **LISP** (Locator/ID Separation Protocol) — discovers endpoint locations.
- **DNA Center:** the central controller for SDA; also discovers WLCs and displays them on the topology map, enabling unified wired+wireless management from one platform.

## Definitions
- **SGT (Scalable Group Tag):** a 16-bit field carried in VXLAN, used to apply security policy based on group membership rather than IP address — simplifies large-scale ACL management.
- **RLOC (Routing Locator):** the IP address of a fabric edge node within the underlay.

## Protocol Operation
1. Endpoint attaches to a fabric edge switch.
2. LISP registers the endpoint's location (mapped to an RLOC) with the control plane.
3. Traffic between endpoints is encapsulated in VXLAN across the underlay (Overlay), using SGTs for policy enforcement rather than raw IP-based ACLs.

## Configuration / Verification / Show / Debug Commands
Not covered — SDA is described conceptually in the source material without CLI syntax (SDA is typically configured via the DNA Center GUI, not traditional IOS CLI, consistent with the source's framing).

## Troubleshooting
Not covered directly.

## Best Practices
Use SGTs instead of IP-based ACLs for security policy in large fabric deployments — dramatically reduces ACL sprawl.

## Security Notes
Applying security policy via SGT (group identity) rather than IP address decouples security policy from network topology/addressing — a significant architectural advantage for enterprise segmentation.

## Interview Questions
- What problem does SGT solve compared to traditional IP-based ACLs?
- What is LISP's role in the SDA control plane?
- How does DNA Center unify wired and wireless management?

## Exam Traps
- Confusing Underlay (physical) with Overlay (VXLAN/logical) roles.
- Assuming SDA security is IP-based — it's identity/group-based (SGT).

## Enterprise Notes
DNA Center's ability to discover and display WLCs on the topology map is a direct link between traditional wireless architecture and the unified SDA/fabric model (see Wireless module below).

## Related Topics
SDN (Ch16), Wireless/WLC, ACL (contrast: SGT vs IP-based ACL).

## Difficulty Level
Hard

## Keywords
Fabric, Underlay, Overlay, VXLAN, LISP, SGT, RLOC, DNA Center

## Tags
`#SDA` `#Fabric` `#DNACenter` `#CCNA-Chapter17`

---

# Module: REST APIs and JSON (Chapter 18)
**Path:** CCNA → Automation → REST API / JSON

## Overview
REST is the dominant API style for Northbound interfaces to SDN controllers; JSON is the standard data format used to exchange structured data over REST.

## Core Concepts
- **REST:** stateless client/server architecture using HTTP verbs to interact with resources.
- **CRUD:** Create, Read, Update, Delete — the four fundamental data operations.
- **Stateless:** each REST request is independent; the server does not need to remember prior requests.

## HTTP Verb → CRUD Mapping
| Verb | CRUD Operation |
|---|---|
| POST | Create |
| GET | Read |
| PATCH / PUT | Update |
| DELETE | Delete |

## JSON Syntax
- **Objects:** enclosed in `{ }`.
- **Arrays:** enclosed in `[ ]`.
- **Key:Value pairs:** key and value separated by a colon.

## YAML
- A human-readable data-serialization language, used heavily in **Ansible** for playbooks (see Ch19).

## Configuration / Verification / Show / Debug Commands
Not covered — API-based chapter; verification is typically done through API tools like Postman rather than IOS CLI (explicitly noted in the source's JSON knowledge-base entry).

## Troubleshooting
Check the HTTP return code — e.g., a 404 indicates the requested resource was not found.

## Best Practices
Review the API's documentation to confirm the correct resource URIs and required authentication headers before building automation against it.

## Security Notes
Not covered beyond general REST usage — no auth-specific detail (e.g., OAuth, API keys) was provided in the source material.

## Interview Questions
- What are the four CRUD actions and their corresponding HTTP verbs?
- What does "stateless" mean in the context of REST, and why does it matter?

## Exam Traps
- Confusing the URI path with query parameters.
- Mixing up PATCH (partial update) with PUT (full replace) — source doesn't explicitly differentiate them, groups both as "Update."

## Enterprise Notes
NETCONF and RESTCONF are both modern Southbound protocols for programmatic device management, and both are supported by DNA Center (noted as a common "exam trap" pairing in the source's Arabic extraction).

## Related Topics
SDN (Ch16 — REST as the NBI), Ansible (Ch19 — consumes JSON/YAML), SDA (Ch17 — DNA Center exposes REST APIs).

## Difficulty Level
Hard

## Keywords
REST, CRUD, JSON, Stateless, HTTP Verb, NETCONF, RESTCONF

## Tags
`#REST` `#JSON` `#YAML` `#Automation` `#CCNA-Chapter18`

---

# Module: Ansible, Puppet, and Chef (Chapter 19)
**Path:** CCNA → Automation

## Overview
Configuration-management tools that solve "configuration drift" — the gradual deviation of a device's actual configuration from its intended baseline — by automating configuration deployment.

## Definitions
- **Configuration Drift:** when a device's actual config deviates from the intended baseline over time.
- **Idempotency:** applying the same configuration multiple times results in the same end state without errors or duplication.
- **Jinja2:** the templating engine used by Ansible.

## Comparison Table
| Feature | Ansible | Puppet | Chef |
|---|---|---|---|
| **Model** | Push | Pull | Pull |
| **Architecture** | Agentless (SSH) | Agent-based* | Agent-based |
| **Action File** | Playbook (YAML) | Manifest | Recipe / Cookbook |
| **Language** | Jinja2 (templates) | Ruby DSL | Ruby DSL |

*Puppet's agent-based nature is marked with an asterisk consistently across sources — flagged as-is without further clarification in the uploaded material (possibly noting an exception or version-dependent behavior not elaborated in source).

## Configuration Commands
```
ansible-playbook [playbook.yml]     ! run from the Ansible control node (system command, not IOS)
```

## Verification / Show / Debug Commands
Not covered — verification occurs on the Ansible control node/output, not via IOS show commands.

## Troubleshooting
- **Playbook fails to connect to 50 routers:** verify SSH connectivity between the control node and targets is the first check, since Ansible is agentless and relies on SSH as its transport.
- **Idempotency check:** if Ansible finds a device already has the correct configuration, it does **not** rewrite it — this no-op behavior is what "idempotency" refers to in the module's dictionary/state-checking logic.

## Best Practices
Use templates and variables to maintain standardized configuration across devices with similar roles, reducing drift and manual error.

## Security Notes
Ansible's agentless SSH-based model means securing SSH access (keys, restricted accounts) on target devices is central to securing the automation pipeline itself.

## Interview Questions
- Why is Ansible considered "agentless" compared to Puppet/Chef?
- What is idempotency, and why does it matter for network automation?
- Push vs. Pull model — what's the operational difference?

## Exam Traps
- Incorrect YAML indentation — YAML is whitespace-sensitive and this is a common source of parsing failure.
- Assuming Ansible will always rewrite configuration on every run — it won't, if the target state already matches (idempotency).

## Enterprise Notes
For 50-router bulk changes (e.g., changing interface speed), the standard failure-diagnosis order is: (1) confirm SSH reachability/credentials, (2) confirm the correct protocol is enabled on target devices, (3) only then investigate playbook logic.

## Related Topics
REST/JSON/YAML (Ch18), SDN (Ch16).

## Difficulty Level
Medium

## Keywords
Playbook, Manifest, Recipe, Idempotency, Configuration Drift, Jinja2

## Tags
`#Ansible` `#Puppet` `#Chef` `#Automation` `#CCNA-Chapter19`

---

# Module: Final Review (Chapter 20)
**Path:** CCNA → Exam Preparation

## Overview
Exam-logistics chapter covering CCNA 200-301 question formats and time-management guidance.

## Core Concepts — Exam Question Types
- Multiple choice
- Drag-and-drop
- Simulation (live config change required)
- Simlet (multiple-choice questions with CLI access to a simulated device)
- Testlet (a set of questions sharing one scenario)

## Best Practices
- No penalty for guessing — always answer every question rather than leaving it blank.

## Related Topics
This chapter references the full curriculum as a cross-cutting review; see the Cross-References section below.

## Difficulty Level
N/A (logistics, not technical content)

## Keywords
Simlet, Testlet, Simulation, Exam Format

## Tags
`#ExamPrep` `#CCNA-Chapter20`

---

# Module: Wireless Architecture (Supplementary — Volume 2 excerpt)
**Path:** CCNA → Wireless

## Overview
The source material notes that deep 802.11/encryption detail lives in "Volume 1" (not provided). What Volume 2 *does* cover: WLAN architecture context, WLC's role in unified management, and CAPWAP, framed through Autonomous vs. Controller-based (SDA) design comparison.

## Core Concepts
- **SOHO Architecture:** a single integrated Wireless Router performs router + switch + AP + firewall roles.
- **Autonomous APs (SOHO):** operate independently, creating and controlling the WLAN with no central controller — no WLC involved.
- **Frame Conversion:** Autonomous APs receive 802.11 wireless frames and convert them to 802.3 Ethernet frames for the wired network.
- **No CAPWAP in SOHO:** since there's no WLC to tunnel to, CAPWAP encapsulation is not used in this architecture.
- **Converged Wired+Wireless (Enterprise/SDA):** Cisco SDA (via DNA Center) manages both wired and wireless from a single platform.

## WLC (Wireless LAN Controller)
- Classified as a core network component alongside routers, switches, and DNA Center.
- DNA Center can discover WLCs and display them on the topology map — unifying enterprise wireless management with the SDA fabric.

## CAPWAP
- Encapsulates traffic between lightweight APs and the WLC in enterprise (non-SOHO) architectures.
- Explicitly **not used** in SOHO, since Autonomous APs don't need to reach a WLC.

## Wireless WAN
- Technologies: 3G, 4G, LTE, 5G.
- Enterprise use: routers can use 4G/5G interface cards for internet access or as backup WAN links.
- **LTE:** newer/faster tech, part of 4G generation.

## Comparison Table — SOHO vs. SDA Wireless
| Feature | SOHO | SDA (Enterprise) |
|---|---|---|
| AP Type | Autonomous | Lightweight |
| Controller | None (integrated in router) | WLC / DNA Center |
| CAPWAP Use | Not used | Core to data/control transport |
| Management | Manual, per-device | Automated via DNA Center |

## Configuration / Verification / Show / Debug Commands
Not covered — this Volume 2 excerpt is architectural/conceptual only; detailed WLC/AP CLI configuration is noted as being in Volume 1 (not provided).

## Troubleshooting
**Scenario (from source):** New AP installed in a SOHO branch, powered on, but devices can't see the SSID.
1. Since it's SOHO/Autonomous, the AP does **not** look for a CAPWAP tunnel — it operates independently and doesn't need a WLC.
2. In this SOHO design, the integrated Wireless Router itself (not a separate WLC) is expected to handle DHCP IP assignment for wireless clients.

## Best Practices
Not covered beyond the SOHO/SDA architectural comparison.

## Security Notes
Not covered (encryption/802.11 security detail explicitly deferred to Volume 1 in the source).

## Interview Questions
- Why doesn't a SOHO AP use CAPWAP?
- What role does DNA Center play in unifying wired and wireless management?

## Exam Traps
- Assuming all APs use CAPWAP — only lightweight APs in a WLC-based (enterprise) design do; Autonomous APs do not.

## Enterprise Notes
Not covered beyond the DNA Center/WLC discovery integration point.

## Related Topics
Cisco SDA (Ch17 — shares DNA Center as controller), DHCP (Ch7 — SOHO router handles wireless client addressing).

## Difficulty Level
Medium

## Keywords
Autonomous AP, Lightweight AP, WLC, CAPWAP, SOHO, DNA Center

## Tags
`#Wireless` `#WLC` `#CAPWAP` `#SOHO` `#CCNA-Wireless`

---

## Cross-References Index (Chapters 16–20 + Wireless)
- **SDN (Ch16) ↔ SDA (Ch17):** SDA is Cisco's concrete SDN implementation for campus networks.
- **SDA (Ch17) ↔ Wireless:** DNA Center unifies both under one controller.
- **REST/JSON (Ch18) ↔ SDN (Ch16):** REST is the NBI protocol connecting apps to the SDN controller.
- **Ansible (Ch19) ↔ REST/JSON/YAML (Ch18):** Ansible playbooks are written in YAML and often interact with REST-based device APIs.
- **Commands used together:** none applicable — Ch16-19 are largely GUI/API/YAML-driven rather than traditional IOS CLI, consistent with the automation/SDN theme.
- **Topics commonly asked together in interviews:** SDN planes + SBI/NBI + REST verbs + Ansible idempotency, typically as one connected "automation" line of questioning.
