// Troubleshooting Engine
// The multi-module scenario generator (e.g. "VLAN + DHCP + ACL + NAT + OSPF").
// Scenarios are built from PRE-DEFINED templates seeded from real troubleshooting
// chains already found in the source material (see scenario-templates/), rather
// than freely combining topics — this avoids incoherent combinations.

import type { ScenarioTemplate } from "../knowledge-engine/types";

export function generateScenario(templateId: string): ScenarioTemplate {
  // TODO(implementation): load from scenario-templates/*.json, keyed by template_id
  throw new Error("Not implemented — Phase E");
}

export function listAvailableTemplates(): string[] {
  // TODO(implementation): read scenario-templates/ directory
  throw new Error("Not implemented — Phase E");
}
