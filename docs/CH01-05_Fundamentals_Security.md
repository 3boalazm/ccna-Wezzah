# Knowledge Modules: Chapters 1–5

---

# Module: TCP/IP Transport (Chapter 1)
**Path:** CCNA → Fundamentals

## Overview
Layer 4 (Transport) functions: error recovery, flow control, and multiplexing between applications using TCP and UDP.

## Definitions
- **Socket:** IP address + transport protocol + port number.
- **Segment:** Layer-4 PDU for TCP.
- **Ephemeral Port:** Dynamic port (49152–65535) used by clients.
- **Multiplexing:** Directing data to the correct app via port numbers.

## Core Concepts
- Connection-oriented (TCP, handshake) vs. connectionless (UDP, no handshake).
- Forward acknowledgment: TCP acks the *next expected* byte, not the last received.
- Flow control (windowing): receiver dictates sender's rate.

## Protocol Operation
1. DNS resolution (UDP/53) resolves hostname → IP.
2. TCP 3-way handshake: SYN → SYN-ACK → ACK.
3. HTTP GET sent over established TCP session.
4. Data transfer with sequencing/segmentation.

## Packet Flow
Client → DNS query (UDP 53) → TCP SYN (port 80/443) → SYN-ACK → ACK → HTTP GET → data transfer.

## Header Fields
- **TCP:** Source Port(16b), Dest Port(16b), Seq#(32b), Ack#(32b), Offset(4b), Flags(6b: SYN/ACK/FIN...), Window(16b), Checksum(16b), Urgent(16b).
- **UDP:** Source Port(16b), Dest Port(16b), Length(16b), Checksum(16b).

## Default Values
TCP header = 20 bytes; UDP header = 8 bytes; standard MTU = 1500 bytes.

## Port Numbers
FTP 20/21, SSH 22, Telnet 23, SMTP 25, DNS 53, DHCP 67/68, TFTP 69, HTTP 80, POP3 110, SNMP 161, HTTPS 443, Syslog 514.

## Timers
Not covered in uploaded chapters.

## Protocol Numbers
TCP = 6, UDP = 17.

## Configuration / Verification / Show / Debug Commands
Not covered (theory-only chapter).

## CLI Output Examples
Not covered.

## Troubleshooting
- Browser can ping server by IP but page won't load by name → check DNS.
- Slow transfer + many duplicate ACKs in captures → possible loss/retransmission issue.

## Best Practices
- Servers use well-known ports so clients can locate services predictably.
- Use SSH (22) instead of Telnet (23) for management.
- Configure NTP for consistent log timestamps.

## Security Notes
UDP performs error *detection* only (checksum), not error recovery — don't confuse the two.

## Interview Questions
- Difference between TCP reset and FIN?
- Why is UDP preferred for voice/video?
- Describe the 3-way handshake.
- What is a TCP sliding window?

## Exam Traps
- Forward acknowledgment = next expected byte, not last received.
- Assuming UDP does error recovery (it only detects errors).

## Enterprise Notes
Not covered.

## Related Topics
DNS, ACL (port-based filtering), NAT (PAT relies on port numbers).

## Difficulty Level
Medium

## Keywords
Socket, Segment, Multiplexing, Ephemeral Port, Windowing

## Tags
`#Transport` `#TCP` `#UDP` `#CCNA-Chapter1`

---

# Module: IPv4 ACLs — Standard & Extended (Chapters 2–3)
**Path:** CCNA → ACL

## Overview
ACLs filter packets on Cisco devices. Standard ACLs match source IP only; Extended ACLs match protocol, source/destination IP, and ports.

## Definitions
- **ACE:** Access Control Entry — one line in an ACL.
- **Wildcard Mask:** '0' = must match, '1' (or '255' in octet form) = ignore.
- **Standard ACL:** Source-IP-only match.
- **Extended ACL:** Full 5-tuple-style match (protocol/src/dst/port).

## Core Concepts
- **First-Match Logic:** router stops at first matching ACE.
- **Implicit Deny:** invisible "deny all" at the end of every ACL.
- **Placement rule:** Standard ACL → near *destination*; Extended ACL → near *source*.
- **Named ACLs:** allow individual line insertion/deletion; sequence numbers default to increments of 10.

## Protocol Operation
1. Packet enters interface → inbound ACL check (if present).
2. Compared sequentially against ACEs.
3. First match triggers permit/deny, search stops.
4. If permitted, routing decision made → outbound ACL checked before egress.

## Packet Flow
Ingress → ACL match (sequential) → Permit/Deny → (if permit) routing lookup → egress ACL check → forward/drop.

## Header Fields
Matches on IP header (source/destination address) and, for extended ACLs, transport header (protocol, port numbers via keywords like `www`=80, `domain`=53, `bootps`=67).

## Default Values
Sequence numbers increment by 10 by default.

## Port Numbers
Table 3-3 keywords: `www`=80, `domain`=53, `bootps`=67 (and other well-known ports from Ch1).

## Timers / Protocol Numbers
Not covered specifically for ACLs beyond referencing TCP(6)/UDP(17)/ICMP.

## Configuration Commands
```
access-list {permit|deny} [source] [wildcard]                     ! Standard
access-list {permit|deny} [protocol] [src] [src-wc] [dst] [dst-wc] [op port]  ! Extended
ip access-list {standard|extended} [name]                          ! Named ACL (global)
ip access-group [number|name] {in|out}                             ! Apply to interface
access-class [number|name] in                                      ! Apply to VTY line
access-list [number] remark [text]
no [sequence-number]                                                ! Delete a line (named ACL mode)
```

## Verification / Show Commands
- `show ip access-lists` — lines + match counters.
- `show access-lists` — all ACL types incl. IPv6.
- `show ip interface [id]` — shows applied ACL + direction.

## Debug Commands
Not covered.

## CLI Output Examples
```
Standard IP access list 1
  10 permit 10.1.1.1 (107 matches)
  20 deny 10.1.1.0, wildcard bits 0.0.0.255 (4 matches)
```
Reading it: line 10 matched 107 packets; the match counter confirms whether traffic is hitting the expected rule.

## Configuration Examples
```
ip access-list extended BLOCK_TELNET
 deny tcp any any eq 23
 permit ip any any
!
interface GigabitEthernet0/1
 ip access-group BLOCK_TELNET in
```

## Troubleshooting
- Broad `permit any` placed before a specific `deny` → deny never triggers.
- Wrong interface/direction applied.
- Standard ACL placed near source → may block source from *all* destinations, not just intended one.
- `log` keyword on an ACE helps identify which rule is being matched.
- Routers do NOT filter self-originated traffic with outbound ACLs.
- ACLs applied inbound may silently block routing-protocol hellos (e.g., OSPF) if not explicitly permitted, breaking neighbor relationships.

## Best Practices
- Put specific statements at top.
- Use `remark` to document intent.
- Disable ACL on interface before major edits.

## Security Notes
Implicit deny means an ACL with only `deny` statements blocks *all* traffic — a common accidental lockout.

## Interview Questions
- Why use named vs. numbered ACLs?
- What does the `established` keyword do in extended ACLs?
- How do you delete one line from a numbered ACL without deleting it all?
- Where should a standard ACL be placed?

## Exam Traps
- Wildcard math errors (e.g., /25 needs `0.0.0.127`, not `0.0.0.255`).
- Matching a single host requires the `host` keyword or `0.0.0.0` wildcard.
- Forgetting implicit deny.

## Enterprise Notes
In WAN scenarios (OSPF over MPLS + NAT + ACL), an inbound ACL blocking OSPF hello packets is a common root cause of neighbor-relationship failure — check `show ip access-lists` match counters as part of the troubleshooting chain.

## Related Topics
NAT (ACLs define NAT-eligible traffic), Routing/OSPF (ACL can break neighbor adjacency), Port Security.

## Difficulty Level
Medium (Standard) / Hard (Extended)

## Keywords
ACE, Wildcard Mask, Implicit Deny, First-Match, Named ACL

## Tags
`#ACL` `#Security` `#CCNA-Chapter2-3`

---

# Module: Security Architectures (Chapter 4)
**Path:** CCNA → Security

## Overview
Foundational security terminology, common attack types, malware categories, and the AAA framework.

## Definitions
- **Vulnerability:** a weakness that can compromise security.
- **Exploit:** a means of taking advantage of a vulnerability.
- **Threat:** the potential to use an exploit.

## Core Concepts
**Attacks:**
- DoS/DDoS — resource depletion to crash systems.
- Spoofing — faking source IP/MAC address.
- Reconnaissance — domain discovery, ping sweeps, port scans.
- Man-in-the-Middle — attacker wedges between two communicating systems.

**Malware:**
- Trojan Horse — hidden inside legitimate software.
- Virus — injects into other apps, needs user action to spread.
- Worm — propagates autonomously.

**AAA:**
- Authentication — "Who are you?"
- Authorization — "What can you do?"
- Accounting — "What did you do?"
- Protocols: TACACS+ (TCP 49, Cisco-proprietary), RADIUS (UDP 1812/1813, open standard).

## Protocol Operation / Packet Flow
Not covered at a packet-flow level in the source material for this chapter.

## Header Fields
Not covered.

## Default Values / Timers
Not covered.

## Port Numbers
TACACS+ = TCP 49; RADIUS = UDP 1812 (auth) / 1813 (accounting).

## Protocol Numbers
Not covered.

## Configuration / Verification / Show / Debug Commands
Not covered (conceptual chapter, no CLI given in source).

## Troubleshooting
Not covered directly, but conceptually: distinguishing whether an incident is reconnaissance vs. active exploitation drives different response paths.

## Best Practices
Not explicitly stated beyond implied AAA separation of duties.

## Security Notes
AAA separates identity verification, permission enforcement, and audit logging into three distinct concerns — a common architecture principle worth restating in enterprise design docs.

## Interview Questions
- Differentiate vulnerability, exploit, and threat.
- Compare TACACS+ and RADIUS.
- What distinguishes a worm from a virus?

## Exam Traps
- Confusing TACACS+ (Cisco proprietary, TCP) with RADIUS (open standard, UDP).

## Enterprise Notes
Not covered.

## Related Topics
Chapter 5 (Securing Network Devices), ACL, Port Security.

## Difficulty Level
Medium

## Keywords
AAA, TACACS+, RADIUS, DoS, Spoofing, Reconnaissance

## Tags
`#Security` `#AAA` `#CCNA-Chapter4`

---

# Module: Securing Network Devices (Chapter 5)
**Path:** CCNA → Security

## Overview
Device hardening: password security mechanisms, remote-access line restrictions, and firewall/IPS concepts.

## Core Concepts
- **IOS Password Types:** Type 7 (weak, reversible, via `service password-encryption`), Type 5 (MD5 hash), Type 8/9 (stronger SHA-256/scrypt hashes).
- **Stateful Firewall:** tracks connection history to filter return traffic.
- **DMZ:** subnet hosting public-facing servers.
- **NGFW:** deep packet inspection via Application Visibility and Control (AVC).
- **NGIPS:** contextual awareness of host OS/software for intrusion detection.

## Configuration Commands
```
service password-encryption
enable secret [password]
username [name] secret [password]
transport input {ssh | telnet | all | none}      ! VTY line mode
```

## Verification / Show / Debug Commands
Not explicitly given in source beyond the config commands above.

## Troubleshooting
Not covered directly.

## Best Practices
- Prefer `enable secret` / `username ... secret` (hashed) over legacy `enable password` / Type-7 encryption.
- Restrict VTY `transport input` to `ssh` only where possible.

## Security Notes
Type 7 encryption is trivially reversible — treat it as obfuscation, not real protection.

## Interview Questions
- Difference between Type 5, 7, 8/9 passwords?
- What does NGFW add beyond a traditional stateful firewall?

## Exam Traps
- Assuming Type 7 passwords are secure because they're "encrypted" — they are weakly encoded and easily reversed.

## Related Topics
AAA (Chapter 4), SSH vs Telnet (Chapter 9), ACL.

## Difficulty Level
Medium

## Keywords
Type 7, Type 5, enable secret, DMZ, NGFW, NGIPS

## Tags
`#Security` `#DeviceHardening` `#CCNA-Chapter5`
