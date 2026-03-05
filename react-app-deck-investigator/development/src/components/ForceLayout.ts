// Force-directed layout for card positioning.
// Runs a fixed number of iterations on import, returns final positions.
// Cards are treated as nodes, synergy connections as attractive edges.

import { Card } from "./CardImporter";
import { SynergyConnection } from "./SynergyEngine";

export interface Position { x: number; y: number; }

const CARD_W = 40;
const CARD_H = 66;
const CANVAS_W = 800;
const CANVAS_H = 700;
const PADDING = 20;

const REPULSION   = 12000;  // node-node repulsion
const ATTRACTION  = 0.03;   // edge spring pull
const DAMPING     = 0.80;
const ITERATIONS  = 500;

// Base rest length — scales up for highly connected cards so clusters breathe
const BASE_REST_LENGTH = 140;
const REST_LENGTH_PER_CONN = 8; // extra px per connection the node has

export function runForceLayout(
  cards: Card[],
  connections: SynergyConnection[],
  leftMargin: number = 0,
): Record<string, Position> {
  if (cards.length === 0) return {};

  // Count connections per card for rest-length scaling
  const connCount: Record<string, number> = {};
  for (const card of cards) connCount[card.cardname] = 0;
  for (const conn of connections) {
    connCount[conn.from] = (connCount[conn.from] ?? 0) + 1;
    connCount[conn.to]   = (connCount[conn.to]   ?? 0) + 1;
  }

  // Seed: evenly spaced circle
  const positions: Record<string, Position> = {};
  const velocities: Record<string, Position> = {};
  const cx = (CANVAS_W + leftMargin) / 2, cy = CANVAS_H / 2;
  const radius = Math.min(cx, cy) * 0.65;

  cards.forEach((card, i) => {
    const angle = (2 * Math.PI * i) / cards.length;
    positions[card.cardname] = {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
    velocities[card.cardname] = { x: 0, y: 0 };
  });

  // Build adjacency
  const adjacency = new Map<string, Set<string>>();
  for (const conn of connections) {
    if (!adjacency.has(conn.from)) adjacency.set(conn.from, new Set());
    if (!adjacency.has(conn.to))   adjacency.set(conn.to,   new Set());
    adjacency.get(conn.from)!.add(conn.to);
    adjacency.get(conn.to)!.add(conn.from);
  }

  const names = cards.map(c => c.cardname);

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

    // Attraction along edges — rest length scales with connectivity
    for (const name of names) {
      const neighbours = adjacency.get(name) ?? new Set<string>();
      const myConns = connCount[name] ?? 0;
      for (const nb of neighbours) {
        const nbConns = connCount[nb] ?? 0;
        const restLen = BASE_REST_LENGTH
          + (myConns + nbConns) * REST_LENGTH_PER_CONN;
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