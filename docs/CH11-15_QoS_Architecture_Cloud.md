# Knowledge Modules: Chapters 11–15

---

# Module: Quality of Service — QoS (Chapter 11)
**Path:** CCNA → Security (Adjacent) / Fundamentals

## Overview
QoS manages bandwidth, delay, jitter, and loss to prioritize traffic (especially voice/video) across a network via classification, marking, queuing, policing, and shaping.

## Definitions
- **Bandwidth:** link capacity in bps.
- **Delay:** time for a packet to cross the network (one-way/round-trip).
- **Jitter:** variation in delay between received packets.
- **Loss:** % of packets failing to arrive.
- **Trust Boundary:** point in the network where QoS markings are trusted (ideally the ingress switch or IP phone).
- **DSCP:** 6-bit field in the IP header for marking.
- **CoS/PCP:** 3-bit field in the 802.1Q header for marking (Layer 2 — lost when crossing a router).
- **Tail Drop:** discarding new packets because a queue is full.

## Protocol Operation
1. **Ingress** — packet enters interface.
2. **Classification** — device matches header fields to identify traffic class.
3. **Marking** — device sets DSCP/CoS/EXP/TID bits per class.
4. **Forwarding decision** — egress interface determined.
5. **Queuing/Scheduling** — packet placed in a queue and prioritized for transmission.

## Header Fields
| Header | Field | Bits |
|---|---|---|
| IPv4 ToS byte | IP Precedence | 3 |
| IPv4/v6 | DSCP | 6 |
| 802.1Q | CoS (PCP) | 3 |
| MPLS Label | EXP | 3 |
| 802.11 | TID | 3 |

## Important Numbers
- Voice: Delay < 150ms, Jitter < 30ms, Loss < 1%.
- Video: Bandwidth 384Kbps–20+Mbps, Delay 200–400ms, Jitter 30–50ms, Loss 0.1–1%.
- DSCP EF (Expedited Forwarding, voice) = decimal 46.
- DSCP AF (Assured Forwarding) = grid of 12 values (AF11–AF43).
- DSCP CS (Class Selector) = CS0–CS7 (backward-compatible with IP Precedence).
- AF41 = Interactive Video; CS0 = Best Effort (default).

## Comparison Table
| Tool | Action | Location |
|---|---|---|
| Policing | Discards or re-marks excess traffic | Ingress/Egress (often ingress) |
| Shaping | Queues/delays packets to match rate | Egress only |

## Configuration / Verification / Show / Debug Commands
Not covered — this chapter in the source material is conceptual (definitions, header fields, numeric thresholds) with no CLI syntax provided.

## Troubleshooting
Not covered directly in source.

## Best Practices
Establish the trust boundary as close to the traffic source as reasonable (ingress switch/IP phone) so markings aren't spoofed by end-user devices.

## Security Notes
Untrusted trust-boundary placement could allow end hosts to self-mark traffic as high priority (QoS abuse) — not explicitly stated as an attack in source, but implied by the trust-boundary concept.

## Interview Questions
- Difference between Policing and Shaping?
- Why is CoS lost when a frame crosses a router but DSCP is not?

## Exam Traps
- CoS persistence: forgetting CoS (Layer 2, 802.1Q) is lost when the packet is routed (Layer 3 boundary).
- Policing vs Shaping direction/action mix-ups.

## Enterprise Notes
Not covered.

## Related Topics
LAN Architecture (Ch13 — PoE for phones/APs needing QoS), WAN Architecture (Ch14 — bandwidth-constrained links needing QoS).

## Difficulty Level
Hard

## Keywords
DSCP, CoS, EF, AF, CS, Trust Boundary, Policing, Shaping

## Tags
`#QoS` `#CCNA-Chapter11`

---

# Module: Miscellaneous IP Services — FHRP, SNMP, TFTP/FTP (Chapter 12)
**Path:** CCNA → Routing (FHRP adjacent) / SNMP

## Overview
Covers First Hop Redundancy Protocols (FHRP) for gateway resiliency, SNMP fundamentals (MIB/NMS), and file-transfer protocols (TFTP/FTP) used for IOS image management.

## Definitions
- **FHRP:** provides a virtual IP + virtual MAC to redundant routers so hosts have a resilient default gateway.
- **MIB:** Management Information Base — database of OIDs on an SNMP agent.
- **NMS:** Network Management Station — the SNMP manager.

## Protocol Operation (HSRP)
1. **Active Router** responds to ARP requests for the virtual IP using the virtual MAC.
2. **Standby Router** listens for hello messages; takes over the Active role if the Active fails.

## Comparison Table — FHRP Protocols
| Protocol | Redundancy Model | Load Balancing |
|---|---|---|
| HSRP | Active/Standby | Per subnet |
| VRRP | Active/Standby | Per subnet |
| GLBP | Active/Active | Per host (round-robin) |

## Port Numbers
- FTP: TCP 20 (data), 21 (control).
- TFTP: UDP 69.
- SNMP Agent: UDP 161.
- SNMP NMS (Traps/Informs): UDP 162.

## Configuration Commands
```
boot system flash [filename]           ! set boot image
ip ftp username [name]
ip ftp password [pass]
verify /md5 [file] [hash]              ! integrity check
```

## Verification / Show / Debug Commands
Not explicitly listed beyond `verify /md5`.

## Troubleshooting
Not covered directly, but implied: HSRP failover issues should be checked against Active/Standby hello timing and virtual IP/MAC consistency across routers.

## Best Practices
Use `verify /md5` after transferring IOS images via TFTP/FTP to confirm integrity before booting from them.

## Security Notes
TFTP has no authentication — treat file transfers over it as trusted-network-only operations.

## Interview Questions
- Compare HSRP, VRRP, and GLBP.
- Why is GLBP the only FHRP offering active/active load balancing?

## Exam Traps
- Assuming HSRP/VRRP support per-host load balancing — only GLBP does.

## Enterprise Notes
Not covered.

## Related Topics
SNMP (Ch9), Routing/Default Gateway design, LAN Architecture.

## Difficulty Level
Medium

## Keywords
HSRP, VRRP, GLBP, MIB, NMS, TFTP, FTP

## Tags
`#FHRP` `#SNMP` `#CCNA-Chapter12`

---

# Module: LAN Architecture (Chapter 13)
**Path:** CCNA → Switching (Design)

## Overview
Campus LAN design patterns (2-tier vs. 3-tier), cabling, and Power over Ethernet (PoE) standards.

## Core Concepts
- **2-Tier Design (Collapsed Core):** star topology at access layer; partial mesh at distribution; core is collapsed into distribution (no separate core layer).
- **3-Tier Design:** distribution switches connect up to a dedicated core layer.

## PoE Standards
| Standard | Power |
|---|---|
| PoE (802.3af) | 15.4W |
| PoE+ (802.3at) | 30W |
| UPoE (802.3bt) | 60W |
| UPoE+ (802.3bt) | 100W |

## Definitions
- **PSE:** Power Sourcing Equipment (e.g., the switch).
- **PD:** Powered Device (e.g., IP phone, AP).

## Configuration / Verification / Show / Debug Commands
Not covered — conceptual/design chapter with no CLI syntax provided in source.

## Troubleshooting
Not covered.

## Best Practices
Choose 3-tier for larger campuses needing a dedicated aggregation point for multiple distribution blocks; 2-tier (collapsed core) suits smaller/simpler campuses.

## Enterprise Notes
Not covered.

## Interview Questions
- When would you choose 3-tier over 2-tier (collapsed core) design?
- What's the difference between PSE and PD?

## Exam Traps
- Confusing "collapsed core" with "no core" — the core function still exists, just merged into distribution.

## Related Topics
EtherChannel/STP (implied for redundancy in these designs, though not detailed in this chapter's source content), WAN Architecture (Ch14).

## Difficulty Level
Easy–Medium

## Keywords
2-Tier, 3-Tier, Collapsed Core, PoE, PSE, PD

## Tags
`#LANArchitecture` `#PoE` `#CCNA-Chapter13`

---

# Module: WAN Architecture (Chapter 14)
**Path:** CCNA → Routing (WAN context)

## Overview
WAN connectivity options: Metro Ethernet (Layer 2 service), MPLS VPN (Layer 3 service), and Internet-based VPNs, plus OSPF behavior across an MPLS provider network.

## Core Concepts
- **Metro Ethernet:** Provider acts like a large Layer-2 switch.
  - **E-Line:** Point-to-Point.
  - **E-LAN:** Full Mesh.
  - **E-Tree:** Hub-and-Spoke (point-to-multipoint).
- **MPLS VPN:** Provider routes the customer's IP packets (Layer 3 service).
- **Internet VPN types:**
  - **Site-to-Site:** permanent tunnel via IPsec/GRE.
  - **Remote Access:** client-to-gateway via TLS (HTTPS).

## OSPF in MPLS VPN WANs
- The Customer Edge (CE) router forms an OSPF neighbor relationship with the Provider Edge (PE) router — **not** directly with CE routers at other customer sites.
- The provider uses **MP-BGP** to carry the customer's OSPF routes across the MPLS backbone.
- **Super Backbone** concept: links separate OSPF areas across sites via the MPLS VPN provider network.

## Important Numbers
- MetroE standards: 1000BASE-ZX (100km reach), 10GBASE-ER (40km reach).
- HTTPS: TCP 443.

## Configuration / Verification / Show / Debug Commands
Not covered — this chapter's source content is conceptual/design-level.

## Troubleshooting
- Branch using OSPF-over-MPLS can't reach central server: check (1) NAT translations, (2) OSPF neighbor state with the PE router via `debug ip ospf hello`, (3) ACL match counters for unintended `deny` statements.

## Best Practices
Understand that OSPF adjacency in an MPLS VPN context is CE–PE, not CE–CE, when designing multi-site OSPF topologies.

## Security Notes
Site-to-Site VPNs (IPsec/GRE) provide encrypted tunnels for permanent inter-site connectivity; Remote Access VPNs secure ad-hoc client connections via TLS.

## Interview Questions
- Explain E-Line vs E-LAN vs E-Tree.
- Why doesn't a CE router form OSPF adjacency directly with a CE router at another site in an MPLS VPN?

## Exam Traps
- Assuming OSPF adjacency spans directly between customer sites in MPLS VPN — it doesn't; it's mediated by the PE via MP-BGP redistribution.

## Enterprise Notes
The 3-step branch-connectivity troubleshooting chain (NAT → OSPF → ACL) recurs as a real enterprise scenario pattern combining Ch2-3 (ACL), Ch10 (NAT), and Ch14 (OSPF/WAN).

## Related Topics
Routing/OSPF, NAT, ACL, Cloud Architecture (Ch15).

## Difficulty Level
Hard

## Keywords
Metro Ethernet, MPLS VPN, E-Line, E-LAN, E-Tree, MP-BGP, Super Backbone

## Tags
`#WAN` `#MPLS` `#OSPF` `#CCNA-Chapter14`

---

# Module: Cloud Architecture (Chapter 15)
**Path:** CCNA → Automation (Cloud Fundamentals)

## Overview
Cloud is a service-delivery model, not simply "the internet." Covers virtualization fundamentals and the three standard service models, plus the five NIST characteristics.

## Core Concepts
- **Virtualization:** hypervisors divide physical hardware into multiple Virtual Machines (VMs).
- **vSwitch:** virtual switch inside the host, connecting VMs to each other and to physical NICs.

## NIST's Five Characteristics of Cloud
1. **On-demand self-service** — user provisions service without human intervention from the provider.
2. **Broad network access** — available across varied devices/networks.
3. **Resource pooling** — large shared resources dynamically allocated.
4. **Rapid elasticity** — resources appear unlimited and scale instantly on demand.
5. **Measured service** — usage is metered and billed accurately.

## Service Models
| Model | Description | Example |
|---|---|---|
| **IaaS** | Virtual machines; customer installs OS/apps | AWS |
| **PaaS** | Development platform; no OS management needed | Google App Engine |
| **SaaS** | Ready-to-use software | Office 365 |

## Configuration / Verification / Show / Debug Commands
Not covered — conceptual chapter.

## Troubleshooting
Not covered.

## Best Practices
Match the service model to organizational control needs: IaaS for full infrastructure control, PaaS to offload OS/runtime management, SaaS for zero-infrastructure consumption.

## Interview Questions
- Explain the five NIST characteristics of cloud computing.
- Compare IaaS, PaaS, and SaaS with real examples.

## Exam Traps
- Mixing up PaaS (dev platform, no OS mgmt) with IaaS (VM-level, customer manages OS).

## Enterprise Notes
Not covered beyond service-model definitions.

## Related Topics
Controller-Based Networking/SDN (Ch16), Cisco SDA (Ch17).

## Difficulty Level
Easy–Medium

## Keywords
NIST, IaaS, PaaS, SaaS, Hypervisor, vSwitch

## Tags
`#Cloud` `#Virtualization` `#CCNA-Chapter15`
