# Addendum: Enrichments from CCNA_Deep_Dive.pdf
**Purpose:** Adds new detail to existing modules (CH01-05, CH06-10, CH16-20) without rewriting them. Apply these as inserts into the relevant module sections.

---

## → ACL Module (adds to CH01-05 file)

**New Troubleshooting content:**
- **Rule-order example (worked):** Goal — block a single host (192.168.10.5) from reaching a server, allow rest of a subnet.
  - ❌ Wrong order: `10 permit ip 192.168.10.0 0.0.0.255 any` then `20 deny ip host 192.168.10.5 any` → line 10 allows everyone including .5; line 20 never triggers.
  - ✓ Correct order: `10 deny ip host 192.168.10.5 any` then `20 permit ip 192.168.10.0 0.0.0.255 any` → specific rule placed before general rule.

**New Wildcard Mask worked example:**
- Rule: subtract each Subnet Mask byte from 255 to get the Wildcard.
- /24 network: Mask 255.255.255.0 → Wildcard 0.0.0.255.
- /26 subnet (64 addresses): Mask 255.255.255.192 → Wildcard 0.0.0.63.
- **Most dangerous common mistake:** writing the regular Subnet Mask instead of the Wildcard in an ACL command — produces the exact opposite of the intended result.

**New Named ACL editing example:**
```
ip access-list extended FINANCE-TO-SERVER
no 20                                                          ! remove line 20 only
15 permit tcp 192.168.20.0 0.0.0.255 host 192.168.30.5 eq 22   ! insert new line at 15
```
Numbered (old-style) ACLs have no sequence numbers — editing usually requires deleting and rewriting the whole list from scratch.

**New complete worked example — restrict Finance to HTTPS-only access to a server:**
```
ip access-list extended FINANCE-TO-SERVER
 permit tcp 192.168.20.0 0.0.0.255 host 192.168.30.5 eq 443
 deny ip any host 192.168.30.5
 permit ip any any
interface GigabitEthernet0/1
 ip access-group FINANCE-TO-SERVER in
```
Note: this is Extended and placed close to the Source (Finance subnet) — matches the "best placement" rule exactly.

**New `show access-lists` reading example:**
```
R1# show access-lists FINANCE-TO-SERVER
10 permit tcp 192.168.20.0 0.0.0.255 host 192.168.30.5 eq 443 (142 matches)
20 deny ip any host 192.168.30.5 (37 matches)
30 permit ip any any (2003 matches)
```
37 blocked attempts on line 20 confirms active attempts to reach the server on a disallowed protocol, and that the rule is working correctly.

---

## → NAT Module (adds to standalone NAT_Knowledge_Module_TEMPLATE.md)

**Fills a previously-flagged gap — Inside Local/Global terminology with a worked packet example:**
```
Before translation (inside network):
Src: 192.168.1.10:5000 → Dst: 8.8.8.8:80
After translation (on the internet):
Src: 203.0.113.5:41000 → Dst: 8.8.8.8:80
```

**New PAT multi-host worked example:**
| Inside Local | Inside Global | Outside Global |
|---|---|---|
| 192.168.1.10:5000 | 203.0.113.5:41000 | 8.8.8.8:80 |
| 192.168.1.11:5000 | 203.0.113.5:41001 | 8.8.8.8:80 |
Same public IP, different port number — this is how the router distinguishes returning traffic for each internal host under PAT.

**New static NAT for publishing an internal web server:**
```
ip nat inside source static tcp 192.168.1.100 80 203.0.113.5 80
```
Any request to 203.0.113.5:80 from the internet automatically redirects to the internal server — the basis of publishing servers behind NAT in small networks.

**Fills previously-flagged Default Values gap partially — troubleshooting for "no translations at all":**
- Most common cause: forgetting to designate `ip nat inside` and/or `ip nat outside` on any interface — without both, all NAT commands are silently ignored entirely.
```
R1# show ip nat translations
(completely empty despite active traffic!)
✓ Fix:
interface GigabitEthernet0/1
 ip nat inside
interface GigabitEthernet0/0
 ip nat outside
```

**New decision guide (which NAT type to choose):**
| Need | Choose |
|---|---|
| One server needs a fixed, known public address | Static NAT |
| Limited number of devices, enough public addresses for all | Dynamic NAT |
| Hundreds of devices, only one public address available (most common case) | PAT (Overload) |

---

## → IPv6 Module (NEW — did not exist in prior extraction; add as a new module under CCNA → IPv6)

**Address Types:**
| Type | Range | Description |
|---|---|---|
| Global Unicast | 2000::/3 | Publicly routable on the internet directly. |
| Link-Local | FE80::/10 | Mandatory on every interface, local scope only, auto-generated. |
| Unique Local | FC00::/7 | Similar to IPv4 Private — not routable on the public internet. |
| Multicast | FF00::/8 | Reaches a registered group of devices together — replaces the Broadcast that doesn't exist in IPv6. |

**Address shortening rules (worked example):**
1. Remove leading zeros in each group: `2001:0DB8:0000:0001:0000:0000:0000:0042` → `2001:DB8:0:1:0:0:0:42`
2. Replace the longest run of consecutive zero groups with `::` (only once per address): `2001:DB8:0:1:0:0:0:42` → `2001:DB8:0:1::42`
- **Exam trap:** using `::` more than once in the same address is illegal — it makes decompression ambiguous.

**Address structure (Global Unicast):**
| Global Routing Prefix | Subnet ID | Interface ID (64 bit) |
|---|---|---|
| Describes the network/ISP (usually assigned by ISP) | Describes the subnet within the organization | Describes the device itself — often built via EUI-64 |

**EUI-64 — worked example:**
```
Original MAC: AC:DE:48:00:11:22
1) Split in half: AC:DE:48 | 00:11:22
2) Insert FFFE: AC:DE:48:FF:FE:00:11:22
3) Flip the 7th bit (U/L): AE:DE:48:FF:FE:00:11:22
Interface ID = AEDE:48FF:FE00:1122
```
With Prefix `2001:DB8:1::/64`, full address = `2001:DB8:1:0:AEDE:48FF:FE00:1122`.

**SLAAC:** device receives a Router Advertisement (RA) carrying the Prefix, and completes its own address by generating its own Interface ID — no DHCP server required.

**Solicited-Node Multicast (worked example):**
Instead of ARP Broadcast reaching every device, NDP builds a special Multicast address from just the last 24 bits of the target device's address — reaching far fewer devices.
```
Target device address: 2001:DB8:1::AEDE:48FF:FE00:1122
Last 24 bits: 00:1122
Solicited-Node Address: FF02::1:FF00:1122
```

**IPv4 vs IPv6 concept mapping:**
| Concept | IPv4 | IPv6 |
|---|---|---|
| Neighbor MAC discovery | ARP | NS / NA |
| Self-addressing | Not present (APIPA only) | SLAAC |
| Multi-device broadcast | Broadcast | Multicast only |

**NDP replaces ARP:**
- **RS/RA:** device asks for a router; router replies with Prefix and settings info.
- **NS/NA:** direct replacement for ARP Request/Reply to learn any device's MAC on the same network.
- **Redirect:** router informs a device of a closer Gateway for the intended destination.

**Configuration commands:**
```
ipv6 unicast-routing                                  ! enable IPv6 routing device-wide (often missed!)
ipv6 address 2001:DB8:1::1/64                          ! manual full address
ipv6 address 2001:DB8:2::/64 eui-64                    ! auto-generate Interface ID via EUI-64
ipv6 enable
```

**Verification commands:**
```
show ipv6 interface brief
show ipv6 neighbors     ! equivalent to ARP Table in IPv4
show ipv6 route
```

**Troubleshooting — router not forwarding IPv6 at all:**
Addresses are correctly configured on all interfaces, but the router isn't passing IPv6 packets between networks — most common cause: routing not enabled device-wide.
```
R1# show running-config | include ipv6 unicast
(no output at all!)
✓ Fix:
R1(config)# ipv6 unicast-routing
```

**Exam traps:**
- `::` can only be used once per address.
- Link-Local is mandatory even without any Global address.
- EUI-64 steps: split, insert FFFE, flip the 7th bit.
- `ipv6 unicast-routing` must be manually enabled on the router.

---

## → Wireless Module (adds substantial new detail to CH16-20 Wireless module)

**Components:**
- **AP:** connects wireless devices to the wired network.
- **WLC:** central device managing all APs (settings, channels, transmit power).
- **Lightweight AP:** operates under WLC management, as opposed to a standalone Autonomous AP.
- **CAPWAP:** protocol creating a tunnel between AP and WLC, split into two parts: **Control** tunnel for settings/management, **Data** tunnel for user traffic.

**New AP Registration flow with WLC:**
```
NEW AP                                    WLC
Discovery Request ──────────────→
←────────────── Discovery Response
Join Request ──────────────→
←────────────── Join Response + IOS image + config
✓ AP is now ready and broadcasting the required SSIDs
```

**SSID + Encryption comparison:**
- **SSID:** the visible wireless network name; a single AP can broadcast multiple SSIDs simultaneously, each mappable to a different VLAN.

| | WPA2 | WPA3 |
|---|---|---|
| Encryption | AES-CCMP | Stronger encryption (192-bit in Enterprise mode) |
| Handshake | 4-Way Handshake (vulnerable to KRACK attack) | SAE |
| Protection | Suitable for most current networks | Protects against offline password guessing |

**New SSID-to-VLAN mapping example:**
| SSID | VLAN | Use |
|---|---|---|
| Corp-Staff | VLAN 10 | Employees — full internal network access |
| Corp-Guest | VLAN 90 | Guests — internet only, isolated from internal |
| Corp-IoT | VLAN 40 | IoT devices — security-isolated |
Same physical AP broadcasts all three, but each SSID routes its traffic to a completely different VLAN — this isolation is the foundation of enterprise wireless security.

**Roaming basics:**
When a device moves from one AP's coverage to another (same SSID), it must transition smoothly without interruption — this is Roaming. With a central WLC, the transition is faster and easier because all APs share the same client information via the Controller, so no need to reconnect from scratch each time. Both APs being connected to the same WLC means the client's Session and IP stay the same during the transition.

**WLAN configuration with WPA3:**
```
wlan Corp-Staff 1 Corp-Staff
security wpa wpa3
security wpa wpa3 sae
client vlan VLAN0010
no shutdown
```
Note: in most companies actual configuration happens via the WLC's GUI, but the underlying concepts (SSID, VLAN, encryption type) are identical.

**Troubleshooting — legacy device can't connect:**
An old device only supports WPA2, but the SSID is configured strictly for WPA3-Personal only (no transition mode) — result is silent connection refusal with no clear error message for the user.
```
Client association failed: unsupported AKM suite
✓ Fix: enable WPA3 Transition Mode (supports WPA2 and WPA3 together on the same SSID)
```

---

## → Security Module (adds to CH01-05 Security module and CH06-10 Port Security/DHCP Snooping modules)

**AAA framework worked flow:**
```
USER (SSH)              SWITCH              AAA SERVER
Username/Password ──────→
Access-Request ──────→
←────── Access-Accept + privileges
Access granted, privileges applied ──────←
```

**TACACS+ vs RADIUS comparison (reinforces existing content with transport-layer detail):**
| | TACACS+ | RADIUS |
|---|---|---|
| Transport | TCP | UDP |
| Encryption | Entire packet | Password only |
| Common use | Network device administration (Cisco-preferred) | End-user authentication |

**Port Security violation modes — reinforced with worked incident:**
Port Gi0/5 configured with `maximum 1` and `violation shutdown`. A small unmanaged switch was connected to that same port, and two devices tried to use it.
```
%PM-4-ERR_DISABLE: psecure-violation error detected on Gi0/5
%PORT_SECURITY-2-PSECURE_VIOLATION: Security violation on Gi0/5
SW# show interfaces Gi0/5 status
Gi0/5 ... err-disabled
✓ Fix: shutdown then no shutdown on the port after removing the extra device
```

**Dynamic ARP Inspection (DAI) — fills previously-flagged gap with concrete config and worked attack scenario:**
Prevents ARP Spoofing by comparing every ARP message against the Binding Table built by DHCP Snooping — any MAC/IP mismatch means the message is rejected immediately. DAI therefore requires DHCP Snooping to be active first.
```
switchport port-security
switchport port-security maximum 2
switchport port-security violation shutdown

ip dhcp snooping
ip dhcp snooping trust        ! on the server-facing port
ip arp inspection vlan 10

show ip dhcp snooping binding  ! (fills previously-flagged verification-command gap)
```

**Worked attack scenario — attacker claiming to be the Gateway:**
```
Without DAI: attacker sends a forged ARP Reply "I am 192.168.1.1 (Gateway)" with their own MAC — all traffic redirects to them.
With DAI enabled: switch compares MAC:IP in the message against the Binding Table — MAC doesn't match the real Gateway, message rejected immediately.
%SW-2-DYNAMIC_ARP_INSPECTION: Invalid ARPs on Gi0/8 (192.168.1.1/AAAA.BBBB.CCCC)
```

---

## → IP Services Module (adds to CH06-10 Device Management module)

**DHCP Relay worked troubleshooting (fills previously-flagged gap):**
Devices on a VLAN separate from the DHCP server don't receive addresses because Broadcast DHCP requests don't cross the router by default. Standard enterprise fix: enable DHCP Relay on the VLAN's gateway interface.
```
interface Vlan20
 ip helper-address 10.1.1.5
✓ Now the Broadcast request converts to Unicast toward the real DHCP server
```

**DHCP Pool configuration on a router (fills gap — router acting as DHCP server):**
```
ip dhcp excluded-address 192.168.1.1 192.168.1.10
ip dhcp pool LAN-POOL
 network 192.168.1.0 255.255.255.0
 default-router 192.168.1.1
 dns-server 8.8.8.8
show ip dhcp binding
```
Addresses .1–.10 excluded because they're reserved for the Gateway and fixed devices (servers, printers).

**DNS lookup verification on a Cisco router:**
```
ip name-server 8.8.8.8
ip domain-lookup
R1# ping example.com
Translating "example.com"...domain server (8.8.8.8) [OK]
```
The router resolves the name to an IP before starting the ping — if resolution fails, an "Unknown host" message appears instead of the ping ever starting.

**DORA sequence — reinforced with detail on why Request is also Broadcast:**
```
CLIENT                          DHCP SERVER
DHCPDISCOVER (broadcast) ─────────→
←───────────────────── DHCPOFFER (192.168.1.50)
DHCPREQUEST (broadcast) ─────────→
←───────────────────── DHCPACK (Lease Time: 24h)
```
Note: Request is also Broadcast — so that if more than one DHCP server responded with an Offer, the rest learn the offer was accepted from another server.

**Syslog severity levels — reinforced with worked log line:**
```
%LINK-3-UPDOWN: Interface Gi0/1, changed state to down
```
The "3" here means Error — systems are typically configured to log/alert only from a certain severity level upward (e.g., 0 to 4) to avoid flooding the logs.

**SSH/Syslog/NTP/SNMP combined config example:**
```
ntp server 10.1.1.1
snmp-server community readonly RO
logging host 10.1.1.50
ip ssh version 2
```

---

## → Automation Module (adds to CH16-20 SDN/Automation modules)

**Why automation matters (motivational framing):**
With networks scaling to hundreds or thousands of devices, manually configuring each device via CLI becomes slow and error-prone. Automation applies the same configuration to a large number of devices consistently, quickly, and in an auditable way.

**Same interface data in three formats — worked comparison:**
```yaml
# YAML
interface: Gi0/1
ip: 10.1.1.1
mask: 255.255.255.0
```
```xml
<!-- XML -->
<interface>
 <name>Gi0/1</name>
 <ip>10.1.1.1</ip>
</interface>
```
```json
{
  "interface": "Gi0/1",
  "ip": "10.1.1.1",
  "mask": "255.255.255.0"
}
```
Same meaning, but YAML uses fewer symbols and reads easier, while XML is more explicit/verbose with brackets.

**RESTCONF worked example (fills previously-flagged gap — no example given before):**
```
GET https://192.168.1.1/restconf/data/interfaces/interface=Gi0%2F1

HTTP/1.1 200 OK
Content-Type: application/yang-data+json
{
  "ietf-interfaces:interface": {
    "name": "GigabitEthernet0/1",
    "enabled": true
  }
}
```
Same idea that previously required SSH + reading `show interface` text output, now a single structured HTTP request returns organized data ready for programmatic processing.

**Ansible Playbook worked example (fills previously-flagged gap):**
```yaml
- name: Configure NTP on all branch routers
  hosts: branch_routers
  tasks:
    - name: Set NTP server
      ios_config:
        lines:
          - ntp server 10.1.1.1
```
A single YAML file executes the same configuration command across all branch routers at once — instead of logging into each device individually.

**NETCONF vs RESTCONF comparison table (reinforces existing content):**
| | RESTCONF | NETCONF |
|---|---|---|
| Transport | HTTP/HTTPS | SSH |
| Data format | JSON / XML | XML + YANG |
| Best suited for | Quick, simple integration | Complex changes and transactions |

**NETCONF worked example (fills previously-flagged gap):**
```xml
<rpc><get-config><source><running/></source>
  <filter><interfaces><interface><name>Gi0/1</name></interface></interfaces></filter>
</get-config></rpc>

<rpc-reply><data><interface><name>Gi0/1</name><enabled>true</enabled></interface></data></rpc-reply>
```
Everything is sent and returned as structured XML over an SSH connection — more verbose than RESTCONF, but more precise for handling large, complex changes/transactions.

**SDN core idea — reinforced:**
Separating the Control Plane (decision-making) from the Data Plane (execution), and moving the decision to one central device (the Controller) instead of every device deciding on its own. This gives a unified view of the whole network from one place, simplifies applying consistent policies, and automating decisions. Controller-based networking has become the foundation of most modern network solutions — a natural extension of automation, and heavily featured in the CCNP track.

**New Terms:**
- **YANG:** a data model formally describing a device's configuration structure.
- **Idempotent:** running the same script twice produces exactly the same result (no duplication/errors).
