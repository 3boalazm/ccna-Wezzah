// Troubleshooting Engine
// The multi-module scenario generator (e.g. "VLAN + DHCP + ACL + NAT + OSPF").
// Scenarios are built from PRE-DEFINED templates seeded from real troubleshooting
// chains already found in the source material (see scenario-templates/), rather
// than freely combining topics — this avoids incoherent combinations.
//
// Loaded the same way knowledge-engine/loader.ts loads /knowledge/*.json:
// Vite's import.meta.glob, eager, so templates are available synchronously.

import type { ScenarioTemplate } from "../knowledge-engine/types";

const templateModules = import.meta.glob<{ default: unknown }>(
  "./scenario-templates/*.json",
  { eager: true }
);

let cache: Map<string, ScenarioTemplate> | null = null;

function loadTemplates(): Map<string, ScenarioTemplate> {
  if (cache) return cache;
  const map = new Map<string, ScenarioTemplate>();
  for (const mod of Object.values(templateModules)) {
    const data = mod.default as ScenarioTemplate;
    if (data && typeof data.template_id === "string") {
      map.set(data.template_id, data);
    }
  }
  cache = map;
  return map;
}

export function generateScenario(templateId: string): ScenarioTemplate {
  const templates = loadTemplates();
  const scenario = templates.get(templateId);
  if (!scenario) {
    throw new Error(`Unknown scenario template_id: ${templateId}`);
  }
  return scenario;
}

export function listAvailableTemplates(): string[] {
  return [...loadTemplates().keys()];
}

// Convenience for the UI: full template objects (not just ids), grouped by
// which topics they touch, so a Scenario Simulator page can show a picker
// without a second round-trip per template.
export function listAvailableScenarios(): ScenarioTemplate[] {
  return [...loadTemplates().values()];
}

// Picks a scenario at random (deterministic-ish via a caller-supplied seed
// so "New scenario" buttons don't repeat within a session if the caller
// increments the seed each click).
export function pickRandomScenario(seed = Date.now()): ScenarioTemplate {
  const all = listAvailableScenarios();
  if (all.length === 0) throw new Error("No scenario templates available");
  const idx = Math.abs(seed) % all.length;
  return all[idx];
}
