# Knowledge Modules: Chapters 6–10

---

# Module: Switch Port Security (Chapter 6)
**Path:** CCNA → Switching → Port Security

## Overview
Restricts which devices may connect to a switch port based on MAC address, protecting against unauthorized device attachment.

## Definitions
- **Sticky Learning:** dynamically learned MACs are auto-added to running-config.
- **Maximum:** number of MACs allowed per port (default = 1).

## Core Concepts — Violation Modes
- **Shutdown (default):** port → `err-disabled`; requires manual `shutdown`/`no shutdown` to recover; sends log alert.
- **Restrict:** drops violating traffic, increments violation counter, sends SNMP/Syslog message.
- **Protect:** drops violating traffic only — no log, no counter increment.

## Protocol Operation
1. Port learns MAC(s) up to the configured maximum (statically, dynamically, or sticky).
2. A frame arrives from an unrecognized MAC beyond the maximum → violation triggered.
3. Action taken per configured violation mode (Shutdown/Restrict/Protect).

## Packet Flow
Frame in → MAC compared to secure MAC table → within limit? forward : trigger violation mode.

## Default Values
Maximum MACs per port = 1; default violation mode = Shutdown.

## Configuration Commands
```
switchport port-security
switchport port-security maximum [value]
switchport port-security mac-address sticky
switchport port-security violation {shutdown | restrict | protect}
```

## Verification / Show Commands
```
show port-security interface [id]
show mac address-table secure
```

## CLI Output Interpretation
`show port-security interface` reveals violation mode, security violation count, and the last offending MAC — the starting point for identifying the cause of an `err-disabled` port.

## Troubleshooting
- Port in `err-disabled`: check `show port-security interface` for violation mode + count + offending MAC, remove/relocate the device, then `shutdown` + `no shutdown` to recover (only required in Shutdown mode).
- Sticky-learned MACs live only in running-config — must `copy run start` (`write`) or they're lost on reload.

## Best Practices
Shut down unused ports and assign them to a dummy/unused VLAN.

## Security Notes
Restrict/Protect modes silently drop traffic without recovering the port automatically — Shutdown is the only mode requiring manual intervention but also the most visible (logs + err-disable state).

## Interview Questions
- Explain the difference between Restrict and Protect violation modes.
- Why would sticky MACs disappear after a reboot?

## Exam Traps
- Forgetting to save config after sticky learning → MACs lost on reload.
- Assuming Restrict/Protect also disable the port — they don't; only Shutdown does.

## Enterprise Notes
Not covered beyond general hardening guidance.

## Related Topics
DHCP Snooping (Ch8), VLAN assignment for unused ports, ACL.

## Difficulty Level
Medium

## Keywords
Sticky Learning, Violation Mode, Err-disable, Maximum MAC

## Tags
`#PortSecurity` `#Switching` `#CCNA-Chapter6`

---

# Module: DHCP (Chapter 7)
**Path:** CCNA → DHCP

## Overview
DHCP automatically assigns IPv4 configuration (address, mask, default gateway, DNS servers) to hosts.

## Core Concepts
- **DORA Process:** Discover → Offer → Request → Acknowledgment.
- **DHCP Relay:** required when the DHCP server is on a different subnet; router rewrites destination from the broadcast 255.255.255.255 to the specific server's unicast address.

## Protocol Operation (DORA)
1. Client broadcasts **Discover**.
2. Server(s) respond with **Offer**.
3. Client broadcasts **Request** (selecting one offer).
4. Server sends **Acknowledgment**, finalizing the lease.

## Packet Flow
Client (broadcast) → DHCP Relay (`ip helper-address`) converts broadcast→unicast → DHCP Server → Offer/Ack routed back to client's subnet.

## Configuration Commands
```
ip helper-address [server-ip]     ! Interface mode, faces the client subnet
ip address dhcp                   ! Interface mode, for a DHCP client device
ip dhcp excluded-address [start] [end]   ! Router-as-server: reserve addresses
ip dhcp pool [name]                       ! Router-as-server: create address pool
 network [subnet] [mask]
```

## Verification Commands
- Windows: `ipconfig /all`
- Mac/Linux: `ifconfig`
- Newer Linux: `ip address`, `ip route`

## Port Numbers
DHCP Server/Client = UDP 67/68.

## Default Values / Timers
Not covered (no default lease time given in source).

## Troubleshooting
- Clients not getting addresses despite a healthy DHCP server on a different subnet → check `ip helper-address` is applied on the interface facing the clients.
- (Cross-reference from Ch8) if DHCP Snooping is enabled and users suddenly stop getting IPs while the server is healthy → check DHCP Snooping trust configuration on the server-facing port.

## Best Practices
Not explicitly listed beyond correct relay placement.

## Security Notes
DHCP itself has no built-in authentication — this is why DHCP Snooping (Ch8) exists as a security layer.

## Interview Questions
- Walk through the DORA process.
- When is DHCP Relay necessary, and what does it actually change in the packet?

## Exam Traps
- Placing `ip helper-address` on the wrong interface (must face the client subnet, not the server).

## Enterprise Notes
Not covered.

## Related Topics
DHCP Snooping/DAI (Ch8), DNS, NAT.

## Difficulty Level
Medium

## Keywords
DORA, DHCP Relay, ip helper-address

## Tags
`#DHCP` `#IPServices` `#CCNA-Chapter7`

---

# Module: DHCP Snooping & Dynamic ARP Inspection (Chapter 8)
**Path:** CCNA → Switching → Security / DHCP

## Overview
Two Layer-2 "First Hop Security" features: DHCP Snooping blocks rogue DHCP servers; DAI prevents ARP-spoofing/MITM attacks, using the binding table DHCP Snooping builds.

## Core Concepts — DHCP Snooping
- Classifies ports as **Trusted** (toward legitimate server) or **Untrusted** (toward users).
- Drops any server-originated message (DHCPOFFER/DHCPACK) arriving on an untrusted port.
- Builds a **Binding Table**: MAC, IP, VLAN, Interface — for each legitimate client.
- **Option 82:** relay information added by switches; should be disabled (`no ip dhcp snooping information option`) on switches that are not acting as a DHCP relay.

## Core Concepts — Dynamic ARP Inspection (DAI)
- Inspects ARP packets on untrusted ports, comparing them against the DHCP Snooping Binding Table.
- If the MAC/IP pair in the ARP packet doesn't match the binding table, the packet is dropped.
- Optional deeper checks available, e.g., validating source MAC (`ip arp inspection validate src-mac`).

## Protocol Operation
**DHCP Snooping:** message arrives on a port → is it a server message (Offer/Ack)? → is the port Trusted? → if Untrusted, drop; if Trusted, forward and record binding.
**DAI:** ARP packet arrives on untrusted port → compare Source MAC + Source IP against binding table entry → match: forward; mismatch: drop.

## Configuration Commands
```
ip dhcp snooping                          ! Global enable
ip dhcp snooping vlan [id]                ! Enable per VLAN
ip dhcp snooping trust                    ! Interface mode, on server-facing port
no ip dhcp snooping information option    ! Disable Option 82 (non-relay switches)

ip arp inspection vlan [id]               ! Global, per VLAN
ip arp inspection trust                   ! Interface mode, trusted port
ip arp inspection validate src-mac        ! Additional validation check
```

## Verification / Show Commands
Not explicitly listed in source beyond the binding-table concept (`show ip dhcp snooping binding` is implied by the binding-table description, but the exact show command text wasn't given in the uploaded material — flagged as a gap).

## Troubleshooting
- **DHCP Snooping enabled → all users stop getting IPs despite healthy server:** almost always the server-facing port (`GigabitEthernet0/1` in the source scenario) is missing `ip dhcp snooping trust` — the switch is dropping the server's own Offer/Ack messages because it treats that port as untrusted by default.
- **DAI enabled without DHCP Snooping:** DAI depends entirely on the DHCP Snooping Binding Table to validate ARP packets. Without Snooping active, there is no binding table to check against, so DAI cannot function correctly.

## Best Practices
Disable Option 82 on switches not performing DHCP relay to ensure Snooping functions correctly.

## Security Notes
DAI's protection is only as good as the underlying DHCP Snooping binding table — if that table is empty or misconfigured, DAI provides no real protection.

## Interview Questions
- What table does DAI rely on, and why?
- Why must the DHCP-server-facing port be marked trusted?

## Exam Traps
- Forgetting `ip dhcp snooping trust` on the server-facing port → total DHCP outage even though the server is fine.
- Enabling DAI without DHCP Snooping — it needs the binding table to function.

## Enterprise Notes
Not covered beyond the scenario above.

## Related Topics
DHCP (Ch7), Port Security (Ch6), ACL.

## Difficulty Level
Medium–Hard

## Keywords
Trusted/Untrusted, Binding Table, Option 82, DAI

## Tags
`#DHCPSnooping` `#DAI` `#Security` `#CCNA-Chapter8`

---

# Module: Device Management Protocols (Chapter 9)
**Path:** CCNA → SNMP / NTP / Syslog / DNS

## Overview
Covers the protocols used to monitor, manage, name-resolve, time-sync, and remotely access network devices: DNS, SNMP, NTP, Syslog, SSH/Telnet, CDP/LLDP.

## DNS
- Translates hostnames to IP addresses via UDP port 53.
- **Recursive DNS:** local resolver queries Root → TLD → Authoritative servers on the client's behalf until it finds the answer.

## SNMP
- **Manager:** software (e.g., Cisco Prime) collecting data.
- **Agent:** software on the managed device supplying data.
- **MIB:** database of variables (OIDs) describing device state.
- **Get/Set:** manager-initiated read/write.
- **Trap/Inform:** device-initiated alert to the manager on an event (e.g., interface down).
- **Versions:** SNMPv3 supports encryption + strong authentication; SNMPv2c uses plaintext "Community Strings."
- **Port Numbers:** Agent listens on UDP 161; Traps/Informs sent to UDP 162.

## NTP
- Synchronizes device clocks — critical for correlating Syslog timestamps across devices.
- **Stratum:** time-accuracy tier (0 = reference clock, most accurate; higher = less accurate).
- **Modes:** `ntp master` (device is a time source), `ntp server` (device syncs externally and can also serve others).

## Syslog
- **Severity Levels 0–7:** 0 Emergency, 1 Alert, 2 Critical, 3 Error, 4 Warning, 5 Notification, 6 Informational, 7 Debugging.
- Destinations: Console, buffered RAM, or external Syslog server via UDP 514.

## SSH vs Telnet
- **SSH:** encrypted, TCP 22 — recommended.
- **Telnet:** plaintext, TCP 23 — vulnerable to interception.

## CDP & LLDP
- **CDP:** Cisco-proprietary, discovers directly connected devices, multicast MAC 0100.0CCC.CCCC.
- **LLDP (802.1AB):** vendor-neutral standard equivalent, multicast MAC 0180.C200.000E.

## Configuration Commands
```
ntp server [address]
ntp master [stratum]
ntp source [interface]

logging buffered [size]
logging [host]
logging console [level]

crypto key generate rsa       ! required to enable SSH, after hostname+domain set

[no] cdp run                  ! global
[no] lldp run                 ! global
```

## Verification / Show Commands
```
show cdp neighbors
show lldp neighbors
```
(No explicit `show ntp status` / `show logging` syntax was given in the uploaded source — flagged as a gap.)

## Troubleshooting
- **Syslog stopped reaching server after its IP changed:** verify the `logging [host]` line points to the new correct address.
- **Raise minimum severity to Warnings-and-above only:** adjust the logging severity level to 4 (Warning) so levels 0–4 are sent, filtering out Notification/Informational/Debugging noise.

## Best Practices
Use SSH over Telnet; configure NTP everywhere for consistent Syslog correlation across devices.

## Security Notes
SNMPv2c's plaintext community strings are a real exposure — prefer SNMPv3 wherever supported.

## Interview Questions
- What's the difference between SNMP Trap and Inform?
- Why does Stratum matter in NTP design?
- CDP vs. LLDP — when would you need LLDP specifically?

## Exam Traps
- Confusing SNMP Get/Set (manager→agent) with Trap/Inform (agent→manager).
- Assuming lower severity number = less important (it's the opposite — 0 is most severe).

## Enterprise Notes
Not covered beyond protocol-level detail.

## Related Topics
Chapter 12 (SNMP/FHRP), Automation (Ch18-19 — NETCONF/RESTCONF as modern management alternatives), Security (SSH hardening).

## Difficulty Level
Medium

## Keywords
MIB, OID, Stratum, Severity Level, CDP, LLDP

## Tags
`#DeviceManagement` `#SNMP` `#NTP` `#Syslog` `#CCNA-Chapter9`

---

# Module: NAT (Chapter 10)
**Path:** CCNA → NAT

**See standalone file:** `NAT_Knowledge_Module_TEMPLATE.md` — this module was already built in full (25-section) detail as the approved template and is not duplicated here. Cross-reference only.

**Quick Links:** Inside Local/Global, Outside Global, Static/Dynamic/PAT, `ip nat inside/outside`, `show ip nat translations`, `show ip nat statistics`.
