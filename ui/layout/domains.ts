// ui/layout/domains.ts
// Maps each topic_id to a domain category for sidebar grouping + color coding.
// This is presentation-layer metadata only — it does NOT belong in the
// Knowledge Engine's data contract (types.ts), since it's about how the UI
// organizes topics, not about the topic's technical content.

export type Domain =
  | "routing"
  | "switching"
  | "security"
  | "ip-services"
  | "automation"
  | "wireless"
  | "architecture";

export const DOMAIN_LABELS: Record<Domain, string> = {
  routing: "Routing",
  switching: "Switching",
  security: "Security",
  "ip-services": "IP services",
  automation: "Automation",
  wireless: "Wireless",
  architecture: "Architecture",
};

// topic_id -> domain. Extend this as more knowledge/*.json files are added.
export const TOPIC_DOMAINS: Record<string, Domain> = {
  ospf: "routing",
  routing_table: "routing",
  fhrp: "routing",

  port_security: "switching",

  acl: "security",
  security: "security",
  dhcp_snooping_dai: "security",

  nat: "ip-services",
  dhcp: "ip-services",
  dns: "ip-services",
  snmp: "ip-services",
  ntp: "ip-services",
  syslog: "ip-services",

  automation: "automation",
  sdn: "automation",
  sda: "automation",

  wireless: "wireless",

  lan_architecture: "architecture",
  wan_architecture: "architecture",
  cloud: "architecture",
  qos: "architecture",
  ipv6: "architecture",
};

export function domainOf(topicId: string): Domain {
  return TOPIC_DOMAINS[topicId] ?? "architecture";
}

// Groups a flat topic_id list into { domain -> topic_ids[] }, in a fixed
// display order so the sidebar doesn't reshuffle between renders.
const DOMAIN_ORDER: Domain[] = [
  "routing",
  "switching",
  "security",
  "ip-services",
  "automation",
  "wireless",
  "architecture",
];

export function groupByDomain(topicIds: string[]): { domain: Domain; topics: string[] }[] {
  const buckets = new Map<Domain, string[]>();
  for (const id of topicIds) {
    const d = domainOf(id);
    if (!buckets.has(d)) buckets.set(d, []);
    buckets.get(d)!.push(id);
  }
  return DOMAIN_ORDER.filter((d) => buckets.has(d)).map((d) => ({
    domain: d,
    topics: buckets.get(d)!.sort(),
  }));
}
