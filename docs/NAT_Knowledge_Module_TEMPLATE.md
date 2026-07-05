# Knowledge Module: Network Address Translation (NAT)

> **Hierarchy Path:** CCNA → NAT
> **Source Documents Merged:** Doc 5 (المرحلة الثانية), Doc 6 (Ch11-20 forensic extraction), Doc 7 (Ch1-10 forensic extraction), Doc 9 (Ch1,2/3,10,11,19 detailed), Doc 10 (Program kickoff summary)
> **Merge Note:** Where sources conflict or one adds detail the other lacks, both are preserved. Nothing is dropped.

---

## Overview
NAT (Network Address Translation) is a mechanism that allows hosts with private IP addresses to communicate with the Internet by translating them into registered public addresses. It solves the problem of IPv4 address exhaustion and allows internal hosts using private addressing to reach external networks.

---

## Definitions
- **Inside Local:** The private IP address assigned to a host on the inside network.
- **Inside Global:** The public IP address that represents an internal host (or hosts) to the outside world.
- **Outside Global:** The IP address of an external (outside) host as seen from the network.
- **Source NAT:** Translating the source IP of packets originating from the inside network.
- **NAT Overload (PAT):** Using transport-layer port numbers to allow many internal hosts to share one (or a few) public IP address(es).

---

## Core Concepts
- **Static NAT:** Manual, permanent one-to-one mapping between an inside local and inside global address. Useful for servers that must be reachable from outside.
- **Dynamic NAT:** Automatic one-to-one mapping, but the global address is drawn from a pool rather than fixed.
- **PAT / NAT Overload:** Many-to-one mapping; thousands of internal devices can share a single public address by differentiating flows via port numbers.
- NAT conserves public IPv4 address space and is standard practice for connecting private networks to the Internet.

---

## Protocol Operation (Step by Step)
1. **Ingress:** A packet from an internal host (e.g., 10.1.1.1) enters the router interface configured as `ip nat inside`.
2. **Trigger check:** The router checks whether the packet's source address matches the ACL referenced in the NAT configuration.
3. **Translation:** The router replaces the source IP (Inside Local) with the assigned public address (Inside Global) — and, in PAT, also rewrites the source port number to keep flows distinguishable.
4. **Egress:** The translated packet exits via the interface configured as `ip nat outside`, toward the Internet/external network.
5. **Return traffic:** When a reply arrives at the outside interface, the router looks up the NAT translation table and rewrites the destination (Inside Global → Inside Local) before forwarding it to the internal host.

---

## Packet Flow
```
Internal Host (10.1.1.1) 
   → enters "ip nat inside" interface
   → matched against NAT ACL
   → source IP rewritten to Inside Global (e.g., 200.1.1.1)
   → exits "ip nat outside" interface → Internet
   ← response arrives at outside interface
   ← router consults NAT table, rewrites destination back to Inside Local
   ← delivered to 10.1.1.1
```

---

## Header Fields
*Not explicitly detailed in the source chapters for NAT itself (NAT operates on IP header source/destination address fields, and on transport-layer port fields for PAT). No additional header-field breakdown (bit lengths, flags) was provided in the uploaded material for this topic — unlike, e.g., the TCP/UDP or QoS chapters, which do include bit-level header tables.*

---

## Default Values
*Not covered in the uploaded chapters.* (No default timeout, default pool size, or default translation lifetime values were provided in the source material.)

---

## Port Numbers
- NAT/PAT relies on the full 16-bit transport port number range (0–65535) to distinguish concurrent flows sharing a single public IP (noted in Doc 9: "Port Numbers: Used by PAT to distinguish between flows (16-bit field, 0–65535)").
- PAT can support over 65,000 concurrent flows per IP address (Doc 9).

---

## Timers
*Not covered in the uploaded chapters for NAT.*

---

## Protocol Numbers
*Not covered in the uploaded chapters for NAT specifically* (protocol numbers 6/TCP and 17/UDP are covered generally in Chapter 1 material, but no NAT-specific protocol number was given).

---

## Configuration Commands
**Interface-level (defining NAT direction):**
```
ip nat inside
ip nat outside
```

**Static NAT:**
```
ip nat inside source static [local-ip] [global-ip]
```

**Dynamic NAT (pool-based):**
```
ip nat pool [name] [start] [end] netmask [mask]
ip nat inside source list [acl] pool [name]
```

**PAT (Overload) — most common:**
```
access-list 1 permit 10.1.1.0 0.0.0.255
ip nat inside source list [acl] interface [type/number] overload
```
(Doc 5 shows this exact pattern: `access-list 1 permit 10.1.1.0 0.0.0.255` followed by `ip nat inside source list 1 interface [type/number] overload`.)

---

## Verification Commands
- `show ip nat translations` — displays the active NAT table.
- `show ip nat statistics` — displays hit/miss counters and pool usage; tracks misses (pool exhaustion).
- `clear ip nat translation *` — clears all dynamic entries (Doc 9).

---

## Show Commands
Same as Verification Commands above — the source material does not separately distinguish "show" from "verification" commands for NAT; they are one and the same set (`show ip nat translations`, `show ip nat statistics`).

---

## Debug Commands
*Not covered in the uploaded chapters for NAT.* (Debug commands were provided for OSPF — `debug ip ospf hello` — but none were given for NAT specifically.)

---

## CLI Output Examples
```text
Total active translations: 3 (0 static, 3 dynamic; 3 extended)
Outside interfaces: Serial0/0/0, Inside interfaces: GigabitEthernet0/0
Hits: 103  Misses: 3
```
**How to read this (per Doc 9):** "Misses" — in dynamic NAT, this counter increments when a packet arrives but no entry exists. If the *pool* misses counter increments specifically, it means the pool of available global addresses is exhausted.

---

## Configuration Examples
**Full PAT example (merged from Doc 5 and Doc 7):**
```
ip nat pool PUBLIC_POOL 200.1.1.1 200.1.1.10 netmask 255.255.255.0
access-list 1 permit 10.1.1.0 0.0.0.255
ip nat inside source list 1 interface GigabitEthernet0/1 overload
!
interface GigabitEthernet0/0
 ip nat inside
!
interface GigabitEthernet0/1
 ip nat outside
```

---

## Troubleshooting
- **Reversed Inside/Outside:** Forgetting to correctly designate `ip nat inside` vs. `ip nat outside` on interfaces prevents NAT from triggering at all.
- **ACL Mismatch:** The ACL referenced in the NAT command doesn't match the actual internal host traffic, so translation never occurs for the intended hosts.
- **Missing `overload` keyword:** Without `overload`, dynamic NAT behaves as one-to-one and will fail/exhaust once the pool addresses are used up once each.
- **Diagnostic scenario (Doc 9):** Users can reach the internal server but can't get to the Internet; `show ip nat statistics` shows many pool misses → indicates pool exhaustion.
- **Diagnostic scenario (Doc 9):** NAT is configured, but `show ip nat translations` is completely empty → indicates traffic isn't matching the NAT ACL or interfaces aren't correctly marked inside/outside.
- **Cross-topic troubleshooting (Doc 5 real-world scenario):** A branch using OSPF over MPLS with NAT Overload and an ACL for protection cannot reach the company server. Recommended troubleshooting order:
  1. Check NAT translations (`show ip nat translations`) — are branch addresses translating correctly?
  2. Check OSPF neighbor relationship with the provider router (`debug ip ospf hello`).
  3. Check the ACL for a `deny` line hitting the intended traffic (`show ip access-lists`) and watch the match counters increment.

---

## Best Practices
- Use PAT (NAT Overload) whenever possible to conserve public IPv4 addresses.
- Use specific ACLs for NAT to avoid translating unwanted traffic (e.g., management traffic) (Doc 9).

---

## Security Notes
- NAT is **not** a security mechanism by itself — it provides address translation, not access control or inspection. A firewall is still required for actual security (flagged explicitly as a "Common Interview Trap" in Doc 9).

---

## Interview Questions
*(Per instructions: questions only, no answers — as the source material itself models this pattern.)*
- What is the purpose of Port Address Translation (PAT)? (Doc 8)
- Explain the difference between Inside Local, Inside Global, and Outside Global addresses.
- Why must the `overload` keyword be included in a dynamic NAT/PAT configuration?
- Does NAT provide security? Why or why not?

---

## Exam Traps
- **Inside vs. Outside confusion:** Mixing up which interface is which (Doc 9).
- **Global vs. Local confusion:** Mixing up the definitions — Local = private/internal-facing, Global = public/external-facing (Doc 9).
- **Forgetting the `overload` keyword**, which limits translations to a strict one-to-one pool mapping instead of many-to-one (Doc 8, Doc 9).

---

## Enterprise Notes
- In a branch office scenario combining OSPF over MPLS, NAT Overload for Internet access, and an ACL for protection, NAT issues are one of three layers (alongside OSPF neighbor state and ACL filtering) that must be checked in sequence when a branch loses connectivity to a central server (Doc 5).

---

## Related Topics
- **ACL** — NAT configurations reference ACLs to define which traffic gets translated (`ip nat inside source list [acl] ...`).
- **Routing / OSPF** — In WAN scenarios, NAT, ACL, and OSPF are troubleshot together as a chain (see Enterprise Notes above).
- **DHCP** — Both are IP-services-layer topics often grouped together in exam objectives.

---

## Difficulty Level
**Hard** (explicitly rated "Hard" in Doc 8 for both the Standard/Extended ACL comparison and the NAT topic itself).

---

## Keywords
Inside Local, Inside Global, Outside Global, Overload, Static NAT, Dynamic NAT, PAT, NAT Pool.

---

## Tags
`#NAT` `#IP-Services` `#PAT` `#CCNA-Chapter10` `#Enterprise-Troubleshooting`

---

## ⚠️ Template Notes for Your Review
1. Several sections above are marked **"Not covered in the uploaded chapters"** (Header Fields, Default Values, Timers, Protocol Numbers, Debug Commands). I did **not** invent plausible-sounding values (e.g., a "24-hour default translation timeout") because that's real-world knowledge, not something in your source docs — per your instruction to never invent information outside the uploaded material. **Decision needed from you:** should empty sections like these (a) stay explicitly flagged as gaps like this, or (b) be filled in with general Cisco/CCNA knowledge I have from training (clearly labeled as "supplementary, not from your sources")?
2. I merged overlapping content from 4 different documents (Docs 5, 7, 9, 10) that all describe NAT slightly differently — some in Arabic, some in English, one as JSON. For this template I translated/normalized everything into one English module. **Decision needed:** do you want bilingual modules (Arabic + English side by side) since some of your source material is in Egyptian-context Arabic, or English-only output?
3. This single module took ~25 structured sections to build properly. Scaling this to all ~20 chapters × sub-topics in your hierarchy (VLAN, Trunk, DTP, STP, EtherChannel, IPv6, OSPF, etc.) means roughly 25-30 similar modules — and several of those topics (VLAN, Trunk, DTP, detailed IPv6) **don't actually appear in your uploaded chapters at all** (your own docs note IPv6 and OSPF fundamentals are "covered in Volume 1," not here). **Decision needed:** should I only build modules for topics that actually exist in your uploaded material, or do you want placeholder modules for the Volume-1 topics too (flagged as "no source data provided")?
