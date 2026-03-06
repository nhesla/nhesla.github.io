import { SynergyDirection } from "./SynergyEngine";

export interface ManualConnection {
  id: string;
  from: string;
  to: string;
  label: string;
  color: string;
  direction: SynergyDirection;
  highlightOnly: boolean;
}

export const MANUAL_COLOR_PRESETS = [
  "#ffffff",
  "#ff4444",
  "#ff8833",
  "#ffcc00",
  "#44cc44",
  "#44cccc",
  "#4488ff",
  "#cc44ff",
  "#ff44cc",
];

export const MANUAL_CONNECTION_DEFAULTS = {
  label: "manual",
  color: MANUAL_COLOR_PRESETS[0],
  direction: "forward" as SynergyDirection,
  highlightOnly: false,
};

function sanitizeId(s: string): string {
  return s.replace(/[^a-zA-Z0-9_-]/g, "_");
}

export function makeManualConnection(
  from: string,
  to: string,
  label: string,
  color: string,
  direction: SynergyDirection,
  highlightOnly: boolean = false,
): ManualConnection {
  const id = sanitizeId(from) + "-" + sanitizeId(to) + "-" + Date.now();
  return { id, from, to, label, color, direction, highlightOnly };
}

// Creates a full mesh of connections between all pairs in a set of card names
export function makeManualMesh(
  cardNames: string[],
  label: string,
  color: string,
  direction: SynergyDirection,
  highlightOnly: boolean = false,
): ManualConnection[] {
  const connections: ManualConnection[] = [];
  for (let i = 0; i < cardNames.length; i++) {
    for (let j = i + 1; j < cardNames.length; j++) {
      connections.push(makeManualConnection(
        cardNames[i], cardNames[j], label, color, direction, highlightOnly,
      ));
    }
  }
  return connections;
}

// Creates connections from one source card to many target cards
export function makeManualStar(
  from: string,
  targets: string[],
  label: string,
  color: string,
  direction: SynergyDirection,
  highlightOnly: boolean = false,
): ManualConnection[] {
  return targets.map(to =>
    makeManualConnection(from, to, label, color, direction, highlightOnly)
  );
}

// ── Edit helpers ──────────────────────────────────────────────────────────────

// Update all connections sharing a label with new properties
export function updateConnectionsByLabel(
  connections: ManualConnection[],
  oldLabel: string,
  updates: Partial<Pick<ManualConnection, "label" | "color" | "direction" | "highlightOnly">>,
): ManualConnection[] {
  return connections.map(c =>
    c.label === oldLabel ? { ...c, ...updates } : c
  );
}

// Remove all connections sharing a label
export function removeConnectionsByLabel(
  connections: ManualConnection[],
  label: string,
): ManualConnection[] {
  return connections.filter(c => c.label !== label);
}

// Remove a single connection by ID
export function removeConnectionById(
  connections: ManualConnection[],
  id: string,
): ManualConnection[] {
  return connections.filter(c => c.id !== id);
}

// Update a single connection by ID
export function updateConnectionById(
  connections: ManualConnection[],
  id: string,
  updates: Partial<Pick<ManualConnection, "label" | "color" | "direction" | "highlightOnly">>,
): ManualConnection[] {
  return connections.map(c =>
    c.id === id ? { ...c, ...updates } : c
  );
}

// Get the most common "from" card in a label group (used when adding a card to a directional group)
export function getMostCommonFrom(
  connections: ManualConnection[],
  label: string,
): string | null {
  const labelConns = connections.filter(c => c.label === label);
  if (labelConns.length === 0) return null;
  const counts: Record<string, number> = {};
  for (const c of labelConns) counts[c.from] = (counts[c.from] ?? 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

// Check if a card is already in a label group (either as from or to)
export function cardIsInLabelGroup(
  connections: ManualConnection[],
  label: string,
  cardname: string,
): boolean {
  return connections.some(c => c.label === label && (c.from === cardname || c.to === cardname));
}
