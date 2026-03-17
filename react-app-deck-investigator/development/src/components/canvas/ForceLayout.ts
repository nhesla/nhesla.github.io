// Force-directed layout for card positioning.
// Runs a fixed number of iterations on import, returns final positions.
// Cards are treated as nodes, synergy connections as attractive edges.
//
// Role-seeded layout: if a roleMap is provided, each card's starting position
// is seeded into a canvas zone based on its detected role rather than a uniform
// circle. The force simulation then runs from those biased starting positions,
// so related cards still pull together but functional groups start in
// predictable areas of the canvas.
//
// Zone layout (approximate):
//
//   ┌─────────────────────────────────────────────┐
//   │  card draw          win conditions  ramp     │  top
//   │                                              │
//   │            (unclassified / core)             │  mid
//   │                                              │
//   │  removal / wipes    aggro    lands / mana    │  bottom
//   └─────────────────────────────────────────────┘

import { Card } from "../data/CardImporter";
import { SynergyConnection } from "../data/SynergyEngine";

export interface Position { x: number; y: number; }

const CARD_W = 40;
const CARD_H = 66;
const CANVAS_W = 800;
const CANVAS_H = 700;
const PADDING = 20;

const REPULSION   = 12000;
const ATTRACTION  = 0.03;
const DAMPING     = 0.80;
const ITERATIONS  = 500;

const BASE_REST_LENGTH    = 140;
const REST_LENGTH_PER_CONN = 8;

// ── Zone definitions ──────────────────────────────────────────────────────────
// Each zone is a center point (as fraction of canvas) that cards of that role
// are seeded toward. The force sim disperses them from there.

const ZONE_FRACTIONS: Record<string, { cx: number; cy: number }> = {
  // ── MTG ──────────────────────────────────────────────────────────────
  "role: mana":               { cx: 0.82, cy: 0.80 },  // bottom-right
  "role: mana dork":          { cx: 0.68, cy: 0.75 },  // bottom-right-ish
  "role: card draw":          { cx: 0.20, cy: 0.18 },  // top-left
  "role: removal":            { cx: 0.18, cy: 0.78 },  // bottom-left
  "role: board wipe":         { cx: 0.28, cy: 0.82 },  // bottom-left-ish
  "role: counterspell":       { cx: 0.15, cy: 0.50 },  // mid-left
  "role: burn spell":         { cx: 0.75, cy: 0.20 },  // top-right
  "role: aggressive creature":{ cx: 0.60, cy: 0.78 },  // bottom-center-right
  // ── YGO ──────────────────────────────────────────────────────────────
  "role: hand trap":   { cx: 0.15, cy: 0.35 },  // left — held in hand, reactive
  "role: floodgate":   { cx: 0.15, cy: 0.60 },  // mid-left — control pieces
  "role: searcher":    { cx: 0.35, cy: 0.20 },  // top-left-ish — consistency
  "role: extender":    { cx: 0.60, cy: 0.30 },  // top-right — combo extension
  "role: boss monster":{ cx: 0.75, cy: 0.50 },  // center-right — win condition
  // "role: removal" already defined in MTG section above — shared across games
  "role: tuner":       { cx: 0.45, cy: 0.65 },  // center — bridges main/extra
  "role: extra deck":  { cx: 0.80, cy: 0.30 },  // top-right — end board
  // ── Lorcana ──────────────────────────────────────────────────────────
  "role: quester":            { cx: 0.50, cy: 0.25 },  // top-center — quest to win
  "role: challenger":         { cx: 0.50, cy: 0.75 },  // bottom-center — challenge to banish
  "role: bodyguard":          { cx: 0.30, cy: 0.60 },  // mid-left — protective
  "role: rush":               { cx: 0.65, cy: 0.65 },  // center-right — aggressive
  "role: song":               { cx: 0.15, cy: 0.35 },  // left — support spells
  "role: support":            { cx: 0.20, cy: 0.50 },  // mid-left — utility
  // "role: removal" is shared — already defined in the MTG section above
};

// Cards with no matching role zone seed to the center of the canvas.
const DEFAULT_ZONE = { cx: 0.50, cy: 0.48 };

function zoneCenter(
  roleLabel: string | undefined,
  leftMargin: number,
): { x: number; y: number } {
  const frac = (roleLabel !== undefined && roleLabel in ZONE_FRACTIONS)
    ? ZONE_FRACTIONS[roleLabel]
    : DEFAULT_ZONE;
  const usableW = CANVAS_W - leftMargin - PADDING;
  return {
    x: leftMargin + PADDING + usableW * frac.cx,
    y: PADDING + (CANVAS_H - 2 * PADDING) * frac.cy,
  };
}

// ── Main export ───────────────────────────────────────────────────────────────

export function runForceLayout(
  cards: Card[],
  connections: SynergyConnection[],
  leftMargin: number = 0,
  roleMap: Record<string, string> = {},  // cardname → role label (e.g. "role: mana")
): Record<string, Position> {
  if (cards.length === 0) return {};

  const connCount: Record<string, number> = {};
  for (const card of cards) connCount[card.cardname] = 0;
  for (const conn of connections) {
    connCount[conn.from] = (connCount[conn.from] ?? 0) + 1;
    connCount[conn.to]   = (connCount[conn.to]   ?? 0) + 1;
  }

  // ── Seed positions from role zones (with small random jitter) ────────────────
  // Without jitter, cards in the same zone would start on top of each other and
  // the repulsion forces would produce a perfectly symmetric, unnatural layout.
  const positions: Record<string, Position> = {};
  const velocities: Record<string, Position> = {};

  cards.forEach(card => {
    const role   = roleMap[card.cardname];
    const center = zoneCenter(role, leftMargin);
    const jitter = 60; // px — enough to break symmetry, not enough to override zone intent
    positions[card.cardname] = {
      x: Math.max(PADDING + leftMargin,
           Math.min(CANVAS_W - CARD_W - PADDING,
             center.x + (Math.random() - 0.5) * jitter)),
      y: Math.max(PADDING,
           Math.min(CANVAS_H - CARD_H - PADDING,
             center.y + (Math.random() - 0.5) * jitter)),
    };
    velocities[card.cardname] = { x: 0, y: 0 };
  });

  // ── Build adjacency ───────────────────────────────────────────────────────────
  const adjacency = new Map<string, Set<string>>();
  for (const conn of connections) {
    if (!adjacency.has(conn.from)) adjacency.set(conn.from, new Set());
    if (!adjacency.has(conn.to))   adjacency.set(conn.to,   new Set());
    adjacency.get(conn.from)!.add(conn.to);
    adjacency.get(conn.to)!.add(conn.from);
  }

  const names = cards.map(c => c.cardname);

  // ── Simulation ────────────────────────────────────────────────────────────────
  for (let iter = 0; iter < ITERATIONS; iter++) {
    const forces: Record<string, Position> = {};
    for (const name of names) forces[name] = { x: 0, y: 0 };

    // Repulsion
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        const a = names[i], b = names[j];
        const dx = positions[b].x - positions[a].x;
        const dy = positions[b].y - positions[a].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = REPULSION / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        forces[a].x -= fx; forces[a].y -= fy;
        forces[b].x += fx; forces[b].y += fy;
      }
    }

    // Attraction along edges
    for (const name of names) {
      const neighbours = adjacency.get(name) ?? new Set<string>();
      const myConns = connCount[name] ?? 0;
      for (const nb of neighbours) {
        const nbConns = connCount[nb] ?? 0;
        const restLen = BASE_REST_LENGTH + (myConns + nbConns) * REST_LENGTH_PER_CONN;
        const dx = positions[nb].x - positions[name].x;
        const dy = positions[nb].y - positions[name].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const displacement = dist - restLen;
        const fx = (dx / dist) * displacement * ATTRACTION;
        const fy = (dy / dist) * displacement * ATTRACTION;
        forces[name].x += fx;
        forces[name].y += fy;
      }
    }

    // Integrate + clamp
    for (const name of names) {
      velocities[name].x = (velocities[name].x + forces[name].x) * DAMPING;
      velocities[name].y = (velocities[name].y + forces[name].y) * DAMPING;
      positions[name].x = Math.max(PADDING + leftMargin,
        Math.min(CANVAS_W - CARD_W - PADDING, positions[name].x + velocities[name].x));
      positions[name].y = Math.max(PADDING,
        Math.min(CANVAS_H - CARD_H - PADDING, positions[name].y + velocities[name].y));
    }
  }

  return positions;
}