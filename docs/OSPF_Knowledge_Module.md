# Knowledge Module: OSPF (Open Shortest Path First)
**Path:** CCNA → Routing → OSPF
**Source:** CCNA_Deep_Dive.pdf (New — this module did not exist before; previously OSPF only appeared briefly under WAN/MPLS context)

## Overview
OSPF is the most important dynamic routing protocol in CCNA scope — the foundation of all dynamic routing topics. Routers exchange network information automatically; if a link fails, an alternate path is recalculated automatically and quickly (Convergence) without human intervention. Handles large, complex networks; initial setup is simple and then self-manages.

## Definitions
- **Convergence:** the speed at which routers recalculate a new best path after a failure.
- **DR (Designated Router) / BDR (Backup DR):** on multi-access networks, elected routers that all other routers (DROTHER) form Full adjacency with, instead of a full mesh of adjacencies.
- **LSDB (Link-State Database):** the complete collection of LSAs a router has received; all routers within the same Area must have an identical copy.
- **SPF (Dijkstra):** algorithm each router runs independently on the same LSDB to build its own shortest-path tree.

## Core Concepts — Static vs. Dynamic Routing
| | Static Routing | OSPF (Dynamic) |
|---|---|---|
| Path management | Engineer writes every route manually | Routers exchange info automatically |
| On failure | Old routes remain; needs manual update | Alternate path recalculated automatically (Convergence) |
| Scale | Suitable for very few routes | Handles large, complex networks |

## Protocol Operation — Neighbor Adjacency Formation
Every OSPF-enabled router sends periodic Hello messages (every 10 seconds on Broadcast networks) on every participating interface. For two routers to become neighbors, these must match exactly:
- **Area ID:** both interfaces must be in the same area.
- **Subnet:** same subnet and mask.
- **Timers:** Hello and Dead Interval must match.
- **Auth:** authentication settings must match if enabled.

Sequence: R1 sends Hello (Area 0, 224.0.0.5) → R2 replies Hello (Neighbor list: R1) → R1 sends Hello (Neighbor list: R2) → 2-Way state reached.

## Neighbor States (Down → Full)
| State | Meaning |
|---|---|
| **Down** | No contact yet; no Hello received from the other side. |
| **Init** | Received a Hello from the neighbor, but its own name hasn't appeared inside it yet — one-directional only. |
| **2-Way** | Each router has seen its own name in the other's Hello; relationship is bidirectional. DR/BDR election happens here on multi-access networks. |
| **ExStart** | The two routers agree on who starts first (Master/Slave) based on higher Router ID. |
| **Exchange** | DBD summaries exchanged, showing database contents without sending full details yet. |
| **Loading** | Each router requests missing LSA details from the other via LSR/LSU messages. |
| **Full** | Databases (LSDB) are completely identical; relationship is ready for path calculation. |

## DR/BDR Election
On multi-access networks (like Ethernet), if every router formed a Full relationship with everyone else, the number of adjacencies would explode. Instead, a **DR** and **BDR** are elected, and all other routers (DROTHER) form Full only with those two.
- Election is based on highest **Priority** (manually configurable, default 1); ties broken by highest **Router ID**.
- **Priority 0** means a router never participates in the election (stays DROTHER permanently).

## LSA Types (in CCNA scope)
| Type | Name | Description |
|---|---|---|
| Type 1 | Router LSA | Each router describes itself and its interfaces within its area. |
| Type 2 | Network LSA | Created by the DR only; describes the multi-access network. |
| Type 3 | Summary LSA | Carried by the ABR between different areas. |
| Type 5 | External LSA | Routes from outside OSPF via redistribution (ASBR). |

## From LSAs to Best Path
1. **LSDB:** every router collects all received LSAs into one database; all routers in the same Area must have an identical copy.
2. **SPF (Dijkstra):** each router runs the algorithm independently on the same database, building its own shortest-path tree rooted at itself.
3. **Routing Table:** best Metric per network (Bandwidth ÷ 10⁸, Cisco default) is added as the final route.

## Configuration Commands
```
router ospf 1
network 10.1.1.0 0.0.0.255 area 0        ! enable OSPF on interfaces within a network
ip ospf priority <n>                      ! set DR/BDR election priority on an interface
```

## Verification Commands
```
show ip ospf neighbor       ! each neighbor and its current state (should reach Full)
show ip ospf database       ! this router's actual LSDB content
show ip protocols           ! summary of active routing protocol settings
```

## Debug Commands
```
debug ip ospf adj           ! live trace of adjacency-building stages, moment by moment
```

## CLI Output Interpretation
```
R1# show ip ospf neighbor
Neighbor ID   Pri   State        Address        Interface
2.2.2.2       100   FULL/DR      192.168.1.2    Gi0/1
4.4.4.4       1     FULL/BDR     192.168.1.4    Gi0/1
3.3.3.3       0     FULL/DROTHER 192.168.1.3    Gi0/1
```
All lines reached FULL — adjacency complete. The second address column shows each neighbor's role (DROTHER/BDR/DR) relative to R1.

## Configuration Examples
```
! R1
interface GigabitEthernet0/1
 ip address 192.168.1.1 255.255.255.0
router ospf 1
 router-id 1.1.1.1
 network 192.168.1.0 0.0.0.255 area 0

! R2 (DR — higher priority)
interface GigabitEthernet0/1
 ip address 192.168.1.2 255.255.255.0
 ip ospf priority 100
router ospf 1
 router-id 2.2.2.2
 network 192.168.1.0 0.0.0.255 area 0
```
(Same pattern repeats for R3 with `ip ospf priority 0`, and R4, using addresses 192.168.1.3 and 192.168.1.4 respectively.)

## Cost (Metric) Calculation — Worked Example
Cisco's default formula: **Cost = 10⁸ ÷ Bandwidth (bps)**, rounded up to the nearest whole number.
| Interface | Bandwidth | Cost |
|---|---|---|
| FastEthernet | 100 Mbps | 1 |
| GigabitEthernet | 1000 Mbps | 1 ⚠️ same as FastEthernet |
| Serial (T1) | 1.544 Mbps | 64 |

**Exam trap:** GigabitEthernet and FastEthernet get the same Cost because the default Reference Bandwidth is only 10⁸ — in modern networks this requires standardizing `auto-cost reference-bandwidth` across all routers to avoid picking a wrong path.

## Troubleshooting

**Scenario 1 — Stuck in Init (Timer Mismatch):**
If R3 has Hello Interval = 10 and R4 has Hello Interval = 5 on the same network, the adjacency stays stuck at Init and never reaches 2-Way, because Timer values must match exactly between neighbors.
```
R3# show ip ospf interface GigabitEthernet0/1 | include Timer
Timer intervals configured, Hello 10, Dead 40
R4# show ip ospf interface GigabitEthernet0/1 | include Timer
Timer intervals configured, Hello 5, Dead 20
```
✗ Mismatch → Fix: standardize the `hello-interval` value on both interfaces.

**Scenario 2 — Stuck in ExStart/Exchange (MTU Mismatch):**
R3 never reaches Full, stuck at EXSTART or EXCHANGE — the most common cause for this specific symptom is an MTU mismatch between the two interfaces.
```
R1# debug ip ospf adj
%OSPF: Nbr 3.3.3.3 has larger interface MTU
R1# show ip ospf interface Gi0/1 | include MTU
MTU 1500
R3# show ip ospf interface Gi0/1 | include MTU
MTU 1400
```
✓ Fix: standardize MTU on both interfaces, or temporarily use `ip ospf mtu-ignore`.

## Best Practices
Standardize `auto-cost reference-bandwidth` across all routers in modern high-bandwidth networks to avoid incorrect path selection caused by the Gigabit/FastEthernet cost collision.

## Security Notes
Authentication (Auth) is one of the four mandatory matching conditions for neighbor formation — if enabled, mismatched authentication settings will silently block adjacency formation just like a timer or subnet mismatch would.

## Interview Questions
- Recite the seven neighbor states in order.
- What is the DR/BDR election criteria (Priority first, then Router ID)?
- Explain the Cost formula and the Gigabit/FastEthernet trap.
- What are the four conditions required to form an OSPF neighbor relationship (Area, Subnet, Timers, Auth)?
- Which LSA Types matter most in a single-area design (Type 1 and Type 2)?
- What is the classic cause of getting stuck in ExStart (MTU mismatch)?

## Exam Traps
- Memorize the seven neighbor states by heart, in order.
- DR/BDR election criterion: Priority first, then Router ID.
- The Cost formula and the Gigabit-vs-FastEthernet trap (both get Cost=1 by default).
- The four conditions to form adjacency: Area, Subnet, Timers, Auth.
- Type 1 and Type 2 LSAs are the most important within a single area.
- MTU mismatch is the classic cause of hanging in ExStart.

## Enterprise Notes
In MPLS VPN WAN designs (cross-reference to WAN Architecture module), the CE router forms OSPF adjacency with the PE router, not directly with CE routers at other sites — this OSPF module's neighbor-formation mechanics apply identically at that CE-PE boundary.

## Related Topics
Routing Table, ACL (can block OSPF Hello packets if applied inbound without explicit permit), WAN Architecture (OSPF over MPLS), NAT (appears together in the 3-step branch-connectivity troubleshooting chain: NAT → OSPF → ACL).

## Difficulty Level
Hard (explicitly called "the most important chapter in the book" in the source)

## Keywords
Convergence, DR, BDR, LSDB, SPF, Dijkstra, LSA, Neighbor States, Cost, MTU

## Tags
`#OSPF` `#DynamicRouting` `#CCNA-Core`
